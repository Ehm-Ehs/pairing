import type { Pairing } from "../types";

export interface SlotCount {
  totalSlots: number;
  filledSlots: number;
  /** 0 to 100. */
  fillPercentage: number;
}

/** How many places an event has and how many are taken. */
export function countSlots(event: Pairing): SlotCount {
  let totalSlots = 0;
  let filledSlots = 0;

  if (event.type === "role-based") {
    totalSlots = Number(event.numParticipants) || 0;
    for (const group of Object.values(event.groups || {})) {
      if (Array.isArray(group)) filledSlots += group.filter((p) => p?.name && p.name.trim() !== "").length;
    }
  } else {
    filledSlots = event.participants?.length || 0;
    // Random positioning has no fixed capacity on this view: every participant fills a place.
    totalSlots = event.type === "secret-santa" ? Number(event.config?.expectedParticipants) || 0 : filledSlots;
  }

  const fillPercentage = totalSlots > 0 ? Math.min(100, Math.round((filledSlots / totalSlots) * 100)) : 0;
  return { totalSlots, filledSlots, fillPercentage };
}

/** The human name of an event's kind, e.g. "Secret Santa" or "First Come, First Served". */
export function eventKindLabel(event: Pairing): string {
  if (event.type === "role-based") return "Group Pairs";
  if (event.type === "secret-santa") return event.config?.allowWishlist ? "Secret Santa" : "Just Pair";
  if (event.assignmentMode === "fcfs") return "First Come, First Served";
  if (event.assignmentMode === "random") return "Random Assignment";
  return "Participants Pick";
}

export interface EventPerson {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

/** Everyone who has joined an event, whatever its type. Empty role-based slots are skipped. */
export function eventPeople(event: Pairing): EventPerson[] {
  const members = event.type === "role-based" ? Object.values(event.groups || {}).flat() : event.participants || [];
  return members
    .filter((p) => p?.name && p.name.trim() !== "")
    .map((p) => ({ id: p.id || p.email || p.name!, name: p.name!, email: p.email, phone: p.phone }));
}
