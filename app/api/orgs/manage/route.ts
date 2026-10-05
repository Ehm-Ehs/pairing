import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { adminDb } from "@/services/firebaseAdmin";
import { requireUser } from "@/server/auth";
import { HttpError, appOrigin, obj, readJson, route, str } from "@/server/http";
import { rateLimit } from "@/server/rateLimit";
import { orgRole } from "@/server/events";
import { cleanBranding, cleanIntegrations, requireOrgAdmin, shortId } from "@/server/orgs";
import { isEmail } from "@/utils/validation";
import { sendEmail } from "@/server/messaging";
import { getOrgInviteEmail } from "@/services/emailTemplates";

const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

/** Membership, invites and settings for an organization. All checks happen here, not in the browser. */
export const POST = route("orgs/manage", async (request) => {
  const user = await requireUser(request);
  const body = await readJson(request);
  const action = str(body.action, 40);
  const orgs = adminDb.collection("Organizations");
  const members = adminDb.collection("OrgMembers");
  const invites = adminDb.collection("OrgInvites");

  if (action === "cancelInvite") {
    const ref = invites.doc(str(body.inviteId, 200));
    const snap = await ref.get();
    if (!snap.exists) throw new HttpError(404, "Invitation not found.");
    await requireOrgAdmin(snap.data()!.orgId, user.uid);
    await ref.update({ status: "cancelled" });
    return NextResponse.json({ success: true });
  }

  const orgId = str(body.orgId, 200);
  if (!orgId) throw new HttpError(400, "orgId is required.");
  const orgRef = orgs.doc(orgId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) throw new HttpError(404, "Organization not found.");
  const org = orgSnap.data()!;

  if (action === "invite") {
    await requireOrgAdmin(orgId, user.uid);
    await rateLimit(`org-invite:${user.uid}`, 50, 3600);
    const email = str(body.email, 200).toLowerCase();
    if (!isEmail(email)) throw new HttpError(400, "Please enter a valid email address.");
    const role = body.role === "admin" ? "admin" : "member";
    const now = Date.now();
    const invite = {
      id: shortId("inv", uuidv4()),
      orgId,
      orgName: org.name,
      email,
      role,
      token: uuidv4(),
      status: "pending",
      invitedBy: user.uid,
      createdAt: now,
      expiresAt: now + INVITE_TTL_MS,
    };
    await invites.doc(invite.id).set(invite);
    const mail = getOrgInviteEmail(org.name, role, `${appOrigin(request)}/invite/${invite.token}`);
    const emailResult = await sendEmail({ to: email, ...mail });
    return NextResponse.json({ success: true, invite, emailSent: emailResult.success });
  }

  if (action === "removeMember") {
    const targetUserId = str(body.targetUserId, 200);
    // Admins can remove anyone; members can remove themselves (leave).
    if (targetUserId !== user.uid) await requireOrgAdmin(orgId, user.uid);
    else if (!(await orgRole(orgId, user.uid))) throw new HttpError(403, "You are not a member of this organization.");

    const memberRef = members.doc(`${orgId}_${targetUserId}`);
    const memberSnap = await memberRef.get();
    if (!memberSnap.exists) throw new HttpError(404, "Member not found in organization.");
    const wasAdmin = memberSnap.data()!.role === "admin";
    await memberRef.delete();

    const remaining = (await members.where("orgId", "==", orgId).get()).docs
      .map((d) => d.data())
      .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
    if (remaining.length === 0) {
      await orgRef.update({ status: "archived", updatedAt: Date.now() });
    } else if (wasAdmin && !remaining.some((m) => m.role === "admin")) {
      // Succession: the longest-tenured member becomes admin.
      await members.doc(remaining[0].id).update({ role: "admin" });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "updateRole") {
    await requireOrgAdmin(orgId, user.uid);
    const targetUserId = str(body.targetUserId, 200);
    const role = body.role === "admin" ? "admin" : "member";
    if (role === "member") {
      if (targetUserId === org.createdBy) {
        throw new HttpError(400, "The creator of the organization cannot be demoted.");
      }
      if (user.uid !== org.createdBy) {
        throw new HttpError(403, "Only the creating admin of the organization can demote other admins.");
      }
    }
    const memberRef = members.doc(`${orgId}_${targetUserId}`);
    if (!(await memberRef.get()).exists) throw new HttpError(404, "Member not found in organization.");
    await memberRef.update({ role });
    return NextResponse.json({ success: true });
  }

  if (action === "updateSettings") {
    await requireOrgAdmin(orgId, user.uid);
    const updates = obj(body.updates);
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (str(updates.name, 120)) patch.name = str(updates.name, 120);
    if (updates.branding !== undefined) patch.branding = cleanBranding(updates.branding);
    if (updates.integrations !== undefined) patch.integrations = cleanIntegrations(updates.integrations);
    await orgRef.update(patch);
    return NextResponse.json({ success: true });
  }

  if (action === "delete") {
    await requireOrgAdmin(orgId, user.uid);
    if (String(org.name).trim().toLowerCase() !== str(body.confirmName, 200).toLowerCase()) {
      throw new HttpError(400, "Organization name confirmation mismatch.");
    }
    const [memberDocs, inviteDocs] = await Promise.all([
      members.where("orgId", "==", orgId).get(),
      invites.where("orgId", "==", orgId).get(),
    ]);
    const batch = adminDb.batch();
    memberDocs.forEach((d) => batch.delete(d.ref));
    inviteDocs.forEach((d) => batch.delete(d.ref));
    batch.delete(orgRef);
    await batch.commit();
    return NextResponse.json({ success: true });
  }

  throw new HttpError(400, "Unknown action.");
});
