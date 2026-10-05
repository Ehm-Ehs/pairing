import { errorMessage } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { randomBytes } from "crypto";
import { FieldValue, DocumentReference } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { adminDb } from "../services/firebaseAdmin";
import { HttpError } from "./http";
import type { LedgerOwner } from "./ledger";

/* eslint-disable @typescript-eslint/no-explicit-any -- event documents are schemaless Firestore data */
export type EventDoc = Record<string, any>;

export interface LoadedEvent {
  ref: DocumentReference;
  data: EventDoc;
}

export function newAccessToken(): string {
  return randomBytes(18).toString("hex");
}

function pairingRef(eventId: string): DocumentReference {
  return adminDb.collection("Pairings").doc(eventId);
}

/**
 * Copies events still stored in the legacy Users/{uid}.pairings array into the
 * Pairings collection, then removes the array. Existing Pairings documents win.
 * Returns the number of events copied.
 */
export async function migrateLegacyPairings(uid: string): Promise<number> {
  const userRef = adminDb.collection("Users").doc(uid);
  const snap = await userRef.get();
  const legacy = snap.data()?.pairings;
  if (!Array.isArray(legacy)) return 0;

  let copied = 0;
  const batch = adminDb.batch();
  for (const item of legacy) {
    if (!item || typeof item !== "object") continue;
    // Events that live in an org workspace were never stored on the user document.
    if (item.ownerType === "org") continue;
    const id = typeof item.id === "string" && item.id ? item.id : uuidv4();
    const ref = pairingRef(id);
    if ((await ref.get()).exists) continue;
    batch.set(ref, {
      ...JSON.parse(JSON.stringify(item)),
      id,
      ownerType: "personal",
      ownerId: uid,
      createdBy: item.createdBy || uid,
    });
    copied++;
  }
  batch.update(userRef, { pairings: FieldValue.delete(), legacyPairingsMigratedAt: Date.now() });
  await batch.commit();
  return copied;
}

/**
 * Loads an event by id, or by the legacy owner + title pair used in old share links.
 * If the event is missing and an owner hint is given, legacy data is migrated first.
 */
export async function loadEvent(input: {
  eventId?: string;
  ownerHint?: string;
  purpose?: string;
}): Promise<LoadedEvent> {
  const { eventId, ownerHint, purpose } = input;

  const attempt = async (): Promise<LoadedEvent | null> => {
    if (eventId) {
      const snap = await pairingRef(eventId).get();
      if (snap.exists) return { ref: snap.ref, data: snap.data() as EventDoc };
    }
    if (!eventId && ownerHint && purpose) {
      const q = await adminDb
        .collection("Pairings")
        .where("ownerId", "==", ownerHint)
        .where("groupingPurpose", "==", purpose)
        .limit(1)
        .get();
      if (!q.empty) return { ref: q.docs[0].ref, data: q.docs[0].data() as EventDoc };
      // Org events are owned by the org, so old share links identify them by their creator.
      const byCreator = await adminDb
        .collection("Pairings")
        .where("createdBy", "==", ownerHint)
        .where("groupingPurpose", "==", purpose)
        .limit(1)
        .get();
      if (!byCreator.empty) return { ref: byCreator.docs[0].ref, data: byCreator.docs[0].data() as EventDoc };
    }
    return null;
  };

  let found = await attempt();
  if (!found && ownerHint) {
    const migrated = await migrateLegacyPairings(ownerHint);
    if (migrated > 0) found = await attempt();
  }
  if (!found) throw new HttpError(404, "Event not found.", "EVENT_NOT_FOUND");
  return found;
}

/**
 * Reads which event a public request is about. Current links carry the event id;
 * older ones identify the event by its organizer and title.
 */
export function eventLocator(body: Record<string, unknown>) {
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "") || undefined;
  return {
    eventId: text(body.eventId, 200),
    ownerHint: text(body.userId ?? body.owner, 200),
    purpose: text(body.groupingPurpose ?? body.purpose, 300),
  };
}

export function eventOwner(event: EventDoc): LedgerOwner {
  if (event.ownerType === "org" && event.ownerId) {
    return { ownerType: "org", ownerId: event.ownerId };
  }
  const ownerId = event.ownerId || event.createdBy;
  if (!ownerId) throw new HttpError(409, "Event has no owner.");
  return { ownerType: "personal", ownerId };
}

export async function orgRole(orgId: string, uid: string): Promise<"admin" | "member" | null> {
  const [member, org] = await Promise.all([
    adminDb.collection("OrgMembers").doc(`${orgId}_${uid}`).get(),
    adminDb.collection("Organizations").doc(orgId).get(),
  ]);
  if (!org.exists) return null;
  if (org.data()?.createdBy === uid) return "admin";
  if (!member.exists) return null;
  return member.data()?.role === "admin" ? "admin" : "member";
}

/** Personal events: the owner. Org events: org admins, or the member who created the event. */
export async function canManageEvent(uid: string, event: EventDoc): Promise<boolean> {
  const owner = eventOwner(event);
  if (owner.ownerType === "personal") return owner.ownerId === uid;
  const role = await orgRole(owner.ownerId, uid);
  if (role === "admin") return true;
  return role === "member" && event.createdBy === uid;
}

export async function assertCanManage(uid: string, event: EventDoc): Promise<void> {
  if (!(await canManageEvent(uid, event))) {
    throw new HttpError(403, "You do not have permission to manage this event.", "FORBIDDEN");
  }
}

export function eventTitle(event: EventDoc): string {
  return event.title || event.groupingPurpose || "PairForm Event";
}

/** True for a real Secret Santa draw, where the match must stay hidden. */
export function isSecretDraw(event: EventDoc): boolean {
  return event.type === "secret-santa" && !!event.config?.allowWishlist;
}

/** A role-based slot nobody has taken yet. */
export const isEmptySlot = (slot: EventDoc): boolean => !slot?.name || String(slot.name).trim() === "";

export interface FoundParticipant {
  participant: EventDoc;
  groupKey?: string;
}

export function allParticipants(event: EventDoc): FoundParticipant[] {
  if (event.type === "role-based") {
    const out: FoundParticipant[] = [];
    for (const [groupKey, members] of Object.entries(event.groups || {})) {
      if (!Array.isArray(members)) continue;
      for (const member of members) {
        if (!isEmptySlot(member)) out.push({ participant: member, groupKey });
      }
    }
    return out;
  }
  return (event.participants || []).map((participant: EventDoc) => ({ participant }));
}

export function findByToken(event: EventDoc, token: string): FoundParticipant | null {
  if (!token) return null;
  return allParticipants(event).find((p) => p.participant.accessToken === token) || null;
}

export function findByEmail(event: EventDoc, email: string): FoundParticipant | null {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  return (
    allParticipants(event).find(
      (p) => typeof p.participant.email === "string" && p.participant.email.trim().toLowerCase() === needle
    ) || null
  );
}

/** What one participant is allowed to know about their own assignment. */
export function describeAssignment(event: EventDoc, found: FoundParticipant) {
  const me = found.participant;
  const base = { eventTitle: eventTitle(event), name: me.name || "", status: event.status || "open" };

  if (event.type === "role-based") {
    const members = ((event.groups || {})[found.groupKey || ""] || [])
      .filter((m: EventDoc) => m?.name)
      .map((m: EventDoc) => ({ name: m.name, role: m.role || "" }));
    return { ...base, kind: "group" as const, groupKey: found.groupKey, role: me.role || "", members };
  }

  if (event.type === "random-positioning") {
    return { ...base, kind: "position" as const, assignedNumber: me.assignedNumber ?? null };
  }

  if (!isSecretDraw(event)) {
    const partner = (event.participants || []).find(
      (p: EventDoc) => p.pairIndex === me.pairIndex && p.id !== me.id
    );
    return {
      ...base,
      kind: "pair" as const,
      pairIndex: me.pairIndex ?? null,
      positionLetter: me.positionLetter || "",
      partner: partner ? { name: partner.name } : null,
    };
  }

  const pair = (event.pairs || []).find((p: EventDoc) => p.santaId === me.id);
  const receiver = pair && (event.participants || []).find((p: EventDoc) => p.id === pair.receiverId);
  return {
    ...base,
    kind: "secret-santa" as const,
    drawn: !!pair,
    receiver: receiver ? { name: receiver.name, wishlist: receiver.wishlist || "" } : null,
    budget: event.config?.budget || "",
    exchangeDate: event.config?.exchangeDate || "",
  };
}

/**
 * The view of an event that anyone with the link may see: names and slot layout,
 * but no contact details, wishlists, private tokens, exclusions or draw results.
 */
export function sanitizeEvent(event: EventDoc): EventDoc {
  const { pairs, participants, groups, config, ...rest } = event;
  const out: EventDoc = { ...rest };

  if (config) {
    const { exclusions: _exclusions, ...publicConfig } = config;
    out.config = publicConfig;
  }
  if (Array.isArray(participants)) {
    out.participants = participants.map((p: EventDoc) => ({
      id: p.id,
      name: p.name || "",
      ...(p.pairIndex !== undefined ? { pairIndex: p.pairIndex } : {}),
      ...(p.positionLetter !== undefined ? { positionLetter: p.positionLetter } : {}),
      ...(p.assignedNumber !== undefined ? { assignedNumber: p.assignedNumber } : {}),
      ...(p.joinedAt !== undefined ? { joinedAt: p.joinedAt } : {}),
    }));
  }
  if (groups && typeof groups === "object") {
    out.groups = Object.fromEntries(
      Object.entries(groups).map(([key, members]) => [
        key,
        Array.isArray(members)
          ? members.map((m: EventDoc) => ({ id: m.id, number: m.number, role: m.role || "", name: m.name || "" }))
          : [],
      ])
    );
  }
  out.hasDraw = Array.isArray(pairs) && pairs.length > 0;
  return out;
}

export function revealUrl(origin: string, eventId: string, token: string): string {
  return `${origin}/your-pairing?id=${encodeURIComponent(eventId)}&t=${encodeURIComponent(token)}`;
}

export async function notifyOrganizer(
  event: EventDoc,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info"
): Promise<void> {
  const userId = event.createdBy || (event.ownerType !== "org" ? event.ownerId : null);
  if (!userId) return;
  try {
    await adminDb.collection("Notifications").add({
      userId,
      message,
      type,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
      link: `/result?id=${event.id}`,
    });
  } catch (err) {
    logger.error("[events] Could not create organizer notification:", errorMessage(err));
  }
}

/** Gives every existing participant a private access token. Returns true if anything changed. */
export function ensureAccessTokens(event: EventDoc): boolean {
  let changed = false;
  for (const { participant } of allParticipants(event)) {
    if (!participant.accessToken) {
      participant.accessToken = newAccessToken();
      changed = true;
    }
  }
  return changed;
}

/** Transactionally backfills access tokens on an older event and returns the fresh data. */
export async function backfillAccessTokens(ref: DocumentReference): Promise<EventDoc> {
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, "Event not found.", "EVENT_NOT_FOUND");
    const event = snap.data() as EventDoc;
    if (ensureAccessTokens(event)) {
      tx.update(ref, event.type === "role-based" ? { groups: event.groups } : { participants: event.participants });
    }
    return event;
  });
}
