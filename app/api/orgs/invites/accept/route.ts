import { NextResponse } from "next/server";
import { adminDb } from "@/services/firebaseAdmin";
import { isAnonymous, requireUser } from "@/server/auth";
import { HttpError, readJson, route, str } from "@/server/http";
import { findPendingInvite, memberRecord } from "@/server/orgs";

/** Accepts an organization invitation for the signed-in user. */
export const POST = route("orgs/invite-accept", async (request) => {
  const user = await requireUser(request);
  if (isAnonymous(user)) throw new HttpError(403, "Please create an account first.", "ACCOUNT_REQUIRED");
  const body = await readJson<Record<string, unknown>>(request);

  const invite = await findPendingInvite(str(body.token, 200));
  if (!invite) throw new HttpError(404, "Invalid or expired invitation token.", "INVALID_INVITE");

  const { orgId, role, email: invitedEmail, orgName } = invite.data;
  const member = memberRecord({
    orgId,
    uid: user.uid,
    email: user.email || invitedEmail || "",
    name: str(body.userName, 120) || str(user.name, 120),
    role: role === "admin" ? "admin" : "member",
  });

  const memberRef = adminDb.collection("OrgMembers").doc(member.id);

  await adminDb.runTransaction(async (tx) => {
    const [fresh, existing] = await Promise.all([tx.get(invite.ref), tx.get(memberRef)]);
    if (fresh.data()?.status !== "pending") {
      throw new HttpError(409, "This invitation has already been used.", "INVALID_INVITE");
    }
    if (!existing.exists) {
      tx.set(memberRef, member);
    }
    tx.update(invite.ref, { status: "accepted", acceptedBy: user.uid, acceptedAt: Date.now() });
  });

  return NextResponse.json({ success: true, orgId, orgName, role });
});
