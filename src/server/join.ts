import { v4 as uuidv4 } from "uuid";
import { HttpError } from "./http";
import { EventDoc, isEmptySlot, isSecretDraw, newAccessToken } from "./events";
import { shuffle } from "../utils/draw";

/**
 * The rules for placing one new participant into an event.
 *
 * Pure: it reads the event, decides where the person goes and returns the change to save.
 * The route runs it inside a transaction together with the token charge.
 */

export interface JoinRequest {
  name: string;
  email: string;
  phone?: string;
  wishlist?: string;
  /** Role-based events: the role the person chose. */
  track?: string;
  /** Role-based events: a specific slot, when the organizer fills one directly. */
  groupKey?: string;
  slotId?: string;
  /** Pair events: the slot the person picked. */
  pairIndex?: number;
  positionLetter?: string;
  /** Random positioning in "participants pick" mode: the number the person picked. */
  assignedNumber?: number;
  /** Organizers adding people by hand or CSV may skip the choices participants must make. */
  isManager: boolean;
}

export interface Placement {
  participant: EventDoc;
  /** The fields to write to the event. */
  update: { groups: Record<string, EventDoc[]> } | { participants: EventDoc[] };
  groupKey?: string;
  groupMembers?: EventDoc[];
  /** True when this join filled the event (or, for role-based events, the group). */
  isFull: boolean;
}

const DEFAULT_PAIR_CAPACITY = 12;
const DEFAULT_POSITION_CAPACITY = 25;

const sameEmail = (value: unknown, email: string) => String(value || "").trim().toLowerCase() === email;
const duplicate = () => new HttpError(409, "This email is already registered for this event.", "DUPLICATE");
const full = (message = "This event is full!") => new HttpError(409, message, "EVENT_FULL");

export function placeParticipant(event: EventDoc, request: JoinRequest): Placement {
  if (event.status === "locked") {
    throw new HttpError(400, "This event is closed. No further registrations are allowed.", "EVENT_CLOSED");
  }

  const participant: EventDoc = {
    id: uuidv4(),
    name: request.name,
    email: request.email,
    ...(request.phone ? { phone: request.phone } : {}),
    accessToken: newAccessToken(),
    joinedAt: Date.now(),
  };

  if (event.type === "role-based") return placeInGroup(event, request, participant);

  const participants: EventDoc[] = Array.isArray(event.participants) ? event.participants : [];
  if (request.email && participants.some((p) => sameEmail(p.email, request.email))) throw duplicate();

  if (event.type === "secret-santa") return placeInSecretSanta(event, request, participant, participants);
  if (event.type === "random-positioning") return placeInPositions(event, request, participant, participants);
  throw new HttpError(400, "Unsupported event type.");
}

function placeInGroup(event: EventDoc, request: JoinRequest, participant: EventDoc): Placement {
  const groups: Record<string, EventDoc[]> = event.groups || {};
  const { email, track = "" } = request;

  if (email) {
    const taken = Object.values(groups).some(
      (members) => Array.isArray(members) && members.some((m) => !isEmptySlot(m) && sameEmail(m.email, email))
    );
    if (taken) throw duplicate();
  }

  let groupKey = "";
  let index = -1;

  // A specific empty slot, when one was asked for.
  if (request.slotId && request.groupKey && Array.isArray(groups[request.groupKey])) {
    const i = groups[request.groupKey].findIndex((s) => s.id === request.slotId);
    if (i !== -1 && isEmptySlot(groups[request.groupKey][i])) {
      groupKey = request.groupKey;
      index = i;
    }
  }

  // Otherwise a random group with a free slot for the chosen role, which spreads people evenly.
  if (index === -1) {
    for (const key of shuffle(Object.keys(groups))) {
      const members = groups[key];
      if (!Array.isArray(members)) continue;
      const i = members.findIndex(
        (slot) => isEmptySlot(slot) && (!track || String(slot.role || "").trim().toLowerCase() === track.toLowerCase())
      );
      if (i !== -1) {
        groupKey = key;
        index = i;
        break;
      }
    }
  }
  if (index === -1) throw full(track ? "No slots are left for that role." : "This event is full.");

  const slot = groups[groupKey][index];
  participant.id = slot.id;
  participant.role = slot.role || "";
  groups[groupKey][index] = {
    ...slot,
    name: request.name,
    email,
    ...(request.phone ? { phone: request.phone } : {}),
    accessToken: participant.accessToken,
    joinedAt: participant.joinedAt,
  };

  return {
    participant,
    update: { groups },
    groupKey,
    groupMembers: groups[groupKey],
    isFull: groups[groupKey].every((s) => !isEmptySlot(s)),
  };
}

function placeInSecretSanta(
  event: EventDoc,
  request: JoinRequest,
  participant: EventDoc,
  participants: EventDoc[]
): Placement {
  const capacity = Number(event.config?.expectedParticipants || 0);
  if (capacity > 0 && participants.length >= capacity) throw full();

  if (isSecretDraw(event)) {
    participant.wishlist = request.wishlist || "";
    participant.pairIndex = -1;
    participant.positionLetter = "";
  } else {
    const totalPairs = Math.max(1, Math.ceil((capacity || DEFAULT_PAIR_CAPACITY) / 2));
    const taken = (pairIndex: number, letter: string) =>
      participants.some((p) => p.pairIndex === pairIndex && p.positionLetter === letter);

    let pairIndex = Number.isInteger(request.pairIndex) ? (request.pairIndex as number) : -1;
    let letter = (request.positionLetter || "").toUpperCase();

    if (pairIndex < 0 || !letter) {
      if (!request.isManager) throw new HttpError(400, "Please choose a slot.");
      // Organizer imports take the first free slot.
      const free = Array.from({ length: totalPairs }, (_, i) => i)
        .flatMap((i) => ["A", "B"].map((l) => [i, l] as const))
        .find(([i, l]) => !taken(i, l));
      if (!free) throw full();
      [pairIndex, letter] = free;
    }
    if (pairIndex >= totalPairs || (letter !== "A" && letter !== "B")) {
      throw new HttpError(400, "That slot does not exist.");
    }
    if (taken(pairIndex, letter)) {
      throw new HttpError(409, "This position was just taken. Please choose another slot.", "SLOT_TAKEN");
    }
    participant.wishlist = "";
    participant.pairIndex = pairIndex;
    participant.positionLetter = letter;
  }

  const next = [...participants, participant];
  return { participant, update: { participants: next }, isFull: capacity > 0 && next.length >= capacity };
}

function placeInPositions(
  event: EventDoc,
  request: JoinRequest,
  participant: EventDoc,
  participants: EventDoc[]
): Placement {
  const total = Number(event.expectedParticipants || DEFAULT_POSITION_CAPACITY);
  if (participants.length >= total) throw full();

  const takenNumbers = new Set(participants.map((p) => p.assignedNumber).filter(Boolean));
  const free = Array.from({ length: total }, (_, i) => i + 1).filter((n) => !takenNumbers.has(n));
  const mode = event.assignmentMode || "participants-pick";
  const requested = Number(request.assignedNumber);

  if (request.isManager && !Number.isInteger(requested)) {
    // Organizer imports stay unassigned until positions are generated.
  } else if (mode === "participants-pick") {
    if (!Number.isInteger(requested) || requested < 1 || requested > total) {
      throw new HttpError(400, "Please choose a position.");
    }
    if (takenNumbers.has(requested)) {
      throw new HttpError(409, "This position is already taken! Please select another one.", "SLOT_TAKEN");
    }
    participant.assignedNumber = requested;
  } else if (mode === "fcfs") {
    participant.assignedNumber = free[0];
  } else {
    participant.assignedNumber = shuffle(free)[0];
  }

  const next = [...participants, participant];
  return { participant, update: { participants: next }, isFull: next.length >= total };
}
