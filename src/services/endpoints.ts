import { logger } from "@/utils/logger";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { apiFetch } from "./api";
import { Pairing } from "../types";

/**
 * Event data access for the browser.
 *
 * Reads and simple organizer edits (create, close, visibility, delete) go straight
 * to Firestore and are enforced by firestore.rules. Anything that changes who is in
 * an event, charges tokens, or produces a draw goes through our API routes.
 */

type WorkspaceRef = { id: string; type: "personal" | "organization"; role?: "admin" | "member" };

const byNewest = (a: Pairing, b: Pairing) => (b.createdAt || 0) - (a.createdAt || 0);

/** Firestore rejects undefined values; this drops them. */
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export async function addPairing(userId: string, pairingData: Pairing, workspace?: WorkspaceRef) {
  const isOrg = workspace?.type === "organization";
  await setDoc(
    doc(db, "Pairings", pairingData.id),
    clean({
      ...pairingData,
      ownerType: isOrg ? "org" : "personal",
      ownerId: isOrg ? workspace!.id : userId,
      createdBy: userId,
    })
  );
}

/**
 * Events in the active workspace. Org admins see every org event;
 * regular members see the events they created.
 */
export async function fetchWorkspacePairings(workspace: WorkspaceRef, userId: string): Promise<Pairing[]> {
  try {
    const isOrg = workspace.type === "organization";
    const snap = await getDocs(
      query(collection(db, "Pairings"), where("ownerId", "==", isOrg ? workspace.id : userId))
    );
    const events = snap.docs.map((d) => d.data() as Pairing);
    if (!isOrg) return events.sort(byNewest);
    const isAdmin = (workspace.role || "member") === "admin";
    return events.filter((e) => isAdmin || e.createdBy === userId).sort(byNewest);
  } catch (error) {
    logger.error("Error fetching workspace pairings:", error);
    return [];
  }
}

async function getPairing(eventId: string): Promise<Pairing> {
  const snap = await getDoc(doc(db, "Pairings", eventId));
  if (!snap.exists()) throw new Error("Event not found");
  return snap.data() as Pairing;
}

/* ---------- Public (participant) flows ---------- */

export interface PublicEventResponse {
  event: Pairing & { hasDraw?: boolean };
  organizer: { firstName: string; lastName: string };
  messages: { closed: string; full: string };
}

/** The public view of an event: names and slots only, no contact details or draw results. */
export function fetchPublicEvent(input: { ownerId?: string; eventId?: string; purpose?: string }) {
  const params = new URLSearchParams();
  if (input.eventId) params.set("eventId", input.eventId);
  if (input.ownerId) params.set("owner", input.ownerId);
  if (input.purpose) params.set("purpose", input.purpose);
  return apiFetch<PublicEventResponse>(`/api/events/public?${params.toString()}`);
}

export interface JoinParticipantInput {
  name: string;
  email?: string;
  phone?: string;
  wishlist?: string;
  track?: string;
  pairIndex?: number;
  positionLetter?: string;
  assignedNumber?: number;
}

export interface JoinResult {
  success: boolean;
  participant: {
    id: string;
    name: string;
    assignedNumber: number | null;
    pairIndex: number | null;
    positionLetter: string;
    role: string;
  };
  groupKey: string | null;
  isFull: boolean;
  /** Private link the participant can use to see their own assignment. */
  revealUrl: string;
}

/**
 * Adds a participant. The server checks the event is open, picks or validates the slot,
 * rejects duplicate emails and charges the organizer's token, all in one transaction.
 */
export function joinEvent(input: {
  ownerId?: string;
  eventId?: string;
  groupingPurpose?: string;
  participant: JoinParticipantInput;
  groupKey?: string;
  slotId?: string;
}) {
  return apiFetch<JoinResult>("/api/events/join", {
    body: {
      userId: input.ownerId,
      eventId: input.eventId,
      groupingPurpose: input.groupingPurpose,
      participant: input.participant,
      groupKey: input.groupKey,
      slotId: input.slotId,
    },
  });
}

export type Assignment =
  | { kind: "group"; eventTitle: string; name: string; groupKey: string; role: string; members: { name: string; role: string }[] }
  | { kind: "position"; eventTitle: string; name: string; assignedNumber: number | null }
  | { kind: "pair"; eventTitle: string; name: string; pairIndex: number | null; positionLetter: string; partner: { name: string } | null }
  | {
      kind: "secret-santa";
      eventTitle: string;
      name: string;
      drawn: boolean;
      receiver: { name: string; wishlist: string } | null;
      budget: string;
      exchangeDate: string;
    };

/**
 * "Already registered?" lookup. Returns the assignment for non-secret events.
 * For Secret Santa it returns { sent: true }: the private link was sent to the
 * participant's registered contact instead of being shown on screen.
 */
export function lookupAssignment(input: { ownerId?: string; eventId?: string; groupingPurpose?: string; email: string }) {
  return apiFetch<{ assignment?: Assignment; sent?: boolean; message?: string }>("/api/events/lookup", {
    body: { userId: input.ownerId, eventId: input.eventId, groupingPurpose: input.groupingPurpose, email: input.email },
  });
}

/** Loads a participant's own assignment from their private link. */
export function fetchReveal(eventId: string, token: string) {
  return apiFetch<{ assignment: Assignment }>(
    `/api/events/reveal?id=${encodeURIComponent(eventId)}&t=${encodeURIComponent(token)}`
  );
}

/* ---------- Organizer flows ---------- */

function manage<T = { success: boolean; event: Pairing }>(body: Record<string, unknown>) {
  return apiFetch<T>("/api/events/manage", { body, auth: "required" });
}

/** Organizer adds a participant by hand or CSV. Charges one token, like any join. */
export async function addParticipantToSecretSanta(userId: string, eventId: string, participant: JoinParticipantInput) {
  return joinEvent({ ownerId: userId, eventId, participant });
}

export async function addParticipantToRandomPositioning(
  userId: string,
  eventId: string,
  participant: JoinParticipantInput
) {
  return joinEvent({ ownerId: userId, eventId, participant });
}

/** Removes participants, or clears their slots in a role-based event. */
export async function removeEventParticipants(eventId: string, ids: string[]) {
  return manage<{ success: boolean; removed: number; event: Pairing }>({ action: "removeParticipants", eventId, ids });
}

export async function removeParticipantFromSecretSanta(_userId: string, eventId: string, participantId: string) {
  await removeEventParticipants(eventId, [participantId]);
}

export async function removeParticipantFromRandomPositioning(_userId: string, eventId: string, participantId: string) {
  await removeEventParticipants(eventId, [participantId]);
}

/**
 * Runs the draw on the server, locks the event and delivers each result privately
 * by email or WhatsApp according to the event's notification channel.
 */
export async function generateDraw(eventId: string): Promise<Pairing> {
  const res = await manage<{ success: boolean; event: Pairing; notified: number }>({ action: "generate", eventId });
  return res.event;
}

/** Pairs of participants who must not draw each other in a Secret Santa. */
export async function setSecretSantaExclusions(eventId: string, exclusions: { a: string; b: string }[]) {
  return manage<{ success: boolean; exclusions: { a: string; b: string }[] }>({
    action: "setExclusions",
    eventId,
    exclusions,
  });
}

export async function updateRoleBasedPairingGroups(
  _userId: string,
  eventId: string,
  _groupingPurpose: string,
  groups: unknown
) {
  await manage({ action: "updateGroups", eventId, groups: clean(groups) });
}

export async function closePairingEvent(_userId: string, eventId: string) {
  await updateDoc(doc(db, "Pairings", eventId), { status: "locked", lastActivityAt: Date.now() });
}

export async function updatePairingVisibility(
  _userId: string,
  eventId: string,
  visibilityMode: "public" | "restricted"
) {
  await updateDoc(doc(db, "Pairings", eventId), { visibilityMode, lastActivityAt: Date.now() });
}

export async function deletePairingEvent(_userId: string, eventId: string) {
  await deleteDoc(doc(db, "Pairings", eventId));
}

/** Copies an event's setup into a new, empty event. Participants and draw results are not copied. */
export async function duplicatePairingEvent(userId: string, eventId: string) {
  const original = await getPairing(eventId);
  const name = original.title || original.groupingPurpose;
  const base = {
    id: crypto.randomUUID(),
    title: `${name} (Copy)`,
    groupingPurpose: `${name} (Copy)`,
    createdAt: Date.now(),
    status: "open" as const,
  };

  let duplicated: Pairing;
  if (original.type === "role-based") {
    const groups = Object.fromEntries(
      Object.entries(original.groups || {}).map(([key, members]) => [
        key,
        members.map((m) => ({ id: m.id, number: m.number, role: m.role || "", name: "", email: "" })),
      ])
    );
    duplicated = { ...original, ...base, groups };
  } else if (original.type === "secret-santa") {
    const { pairs: _pairs, ...rest } = original;
    duplicated = { ...rest, ...base, participants: [], config: { ...original.config, exclusions: [] } };
  } else {
    duplicated = { ...original, ...base, participants: [] };
  }

  const workspace: WorkspaceRef | undefined =
    original.ownerType === "org" && original.ownerId ? { id: original.ownerId, type: "organization" } : undefined;
  await addPairing(userId, duplicated, workspace);
  return duplicated;
}
