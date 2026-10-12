import type { DocumentReference } from "firebase-admin/firestore";
import { ORG_DELETION_WORKING_DAYS } from "@/content/legal";
import { addWorkingDays } from "@/utils/workingDays";
import { adminAuth, adminDb } from "../services/firebaseAdmin";
import { clearResetCode } from "./passwordReset";

/**
 * Account and organization deletion, as described in the Privacy Policy.
 *
 * Token and payment records (TokenLedgers, TokenLedgerEntries, Payments) are never deleted here:
 * they are kept for accounting and payment disputes.
 */

const BATCH_SIZE = 400;

async function deleteAll(docs: { ref: DocumentReference }[]): Promise<void> {
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

const orgRef = (orgId: string) => adminDb.collection("Organizations").doc(orgId);
const membersOf = (orgId: string) => adminDb.collection("OrgMembers").where("orgId", "==", orgId).get();

/** Starts the waiting period before an organization is permanently deleted. Returns the deletion time. */
export async function scheduleOrgDeletion(orgId: string, requestedBy: string, now = Date.now()): Promise<number> {
  const deletionScheduledFor = addWorkingDays(now, ORG_DELETION_WORKING_DAYS).getTime();
  await orgRef(orgId).update({
    deletionRequestedAt: now,
    deletionRequestedBy: requestedBy,
    deletionScheduledFor,
    updatedAt: now,
  });
  return deletionScheduledFor;
}

export async function cancelOrgDeletion(orgId: string): Promise<void> {
  await orgRef(orgId).update({
    deletionRequestedAt: null,
    deletionRequestedBy: null,
    deletionScheduledFor: null,
    updatedAt: Date.now(),
  });
}

/** Permanently deletes an organization with its events, members and invites. */
export async function purgeOrganization(orgId: string): Promise<void> {
  const [events, members, invites] = await Promise.all([
    adminDb.collection("Pairings").where("ownerId", "==", orgId).get(),
    membersOf(orgId),
    adminDb.collection("OrgInvites").where("orgId", "==", orgId).get(),
  ]);
  await deleteAll([...events.docs, ...members.docs, ...invites.docs]);
  await orgRef(orgId).delete();
}

/**
 * Removes a user from an organization.
 *
 * If the last admin leaves, the longest-tenured member becomes admin. If nobody is left,
 * the organization is archived and scheduled for deletion.
 *
 * With `handOver` (the user's account is being deleted) the organization keeps the events
 * that user created: they, and the organization itself if the user founded it, pass to an admin.
 */
export async function leaveOrganization(orgId: string, uid: string, handOver = false): Promise<void> {
  const members = adminDb.collection("OrgMembers");
  const memberRef = members.doc(`${orgId}_${uid}`);
  const [orgSnap, memberSnap] = await Promise.all([orgRef(orgId).get(), memberRef.get()]);
  if (!orgSnap.exists) return;
  const org = orgSnap.data()!;
  const isFounder = org.createdBy === uid;
  const wasAdmin = memberSnap.data()?.role === "admin" || (handOver && isFounder);
  if (memberSnap.exists) await memberRef.delete();

  const remaining = (await membersOf(orgId)).docs
    .map((d) => d.data())
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

  if (remaining.length === 0) {
    if (!org.deletionScheduledFor) {
      await orgRef(orgId).update({ status: "archived" });
      await scheduleOrgDeletion(orgId, uid);
    }
    return;
  }

  if (wasAdmin && !remaining.some((m) => m.role === "admin")) {
    await members.doc(remaining[0].id).update({ role: "admin" });
    remaining[0].role = "admin";
  }
  if (!handOver) return;

  const heir = remaining.find((m) => m.role === "admin");
  if (!heir) return;
  if (isFounder) await orgRef(orgId).update({ createdBy: heir.userId, updatedAt: Date.now() });
  const created = await adminDb.collection("Pairings").where("createdBy", "==", uid).get();
  const batch = adminDb.batch();
  created.docs
    .filter((d) => d.data()?.ownerId === orgId)
    .forEach((d) => batch.update(d.ref, { createdBy: heir.userId }));
  await batch.commit();
}

/**
 * Permanently deletes a user's account: their profile, sign-in, personal events (with the
 * participants in them) and notifications. Events they created inside an organization stay
 * with that organization.
 */
export async function deleteAccount(uid: string, email?: string): Promise<void> {
  const [memberships, founded] = await Promise.all([
    adminDb.collection("OrgMembers").where("userId", "==", uid).get(),
    adminDb.collection("Organizations").where("createdBy", "==", uid).get(),
  ]);
  const orgIds = new Set<string>([
    ...memberships.docs.map((d) => d.data()?.orgId as string),
    ...founded.docs.map((d) => d.id),
  ]);
  for (const orgId of orgIds) {
    if (orgId) await leaveOrganization(orgId, uid, true);
  }

  const address = email?.trim().toLowerCase();
  const [events, notifications, pushSubscriptions, invites] = await Promise.all([
    adminDb.collection("Pairings").where("ownerId", "==", uid).get(),
    adminDb.collection("Notifications").where("userId", "==", uid).get(),
    adminDb.collection("push_subscriptions").where("userId", "==", uid).get(),
    address ? adminDb.collection("OrgInvites").where("email", "==", address).get() : { docs: [] },
  ]);
  await deleteAll([...events.docs, ...notifications.docs, ...pushSubscriptions.docs, ...invites.docs]);
  if (address) await clearResetCode(address);
  await adminDb.collection("Users").doc(uid).delete();

  try {
    await adminAuth.deleteUser(uid);
  } catch (err) {
    if ((err as { code?: string }).code !== "auth/user-not-found") throw err;
  }
}
