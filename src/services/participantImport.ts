import { errorCode } from "../utils/errors";
import { joinEvent } from "./endpoints";
import type { ParsedParticipant } from "../utils/csvImport";

/**
 * Adds participants from a CSV to an event, one by one, through the normal join flow
 * (so each one is validated and charged a token like any other participant).
 *
 * Duplicate emails are skipped. For role-based events a person whose role has no free
 * slot is placed in any free slot. Importing stops when the event is full.
 * Returns how many participants were added.
 */
export async function importParticipants(eventId: string, parsed: ParsedParticipant[]): Promise<number> {
  let added = 0;

  for (const person of parsed) {
    if (!person.name && !person.email) continue;
    const participant = {
      name: person.name || person.email.split("@")[0] || "Participant",
      email: person.email || "",
      phone: person.phone || "",
      wishlist: person.wishlist || "",
    };

    try {
      await joinEvent({ eventId, participant: { ...participant, track: person.role || "" } });
      added++;
    } catch (error) {
      if (errorCode(error) === "DUPLICATE") continue;
      if (errorCode(error) !== "EVENT_FULL") throw error;
      if (!person.role) break;

      // No slot left for that role: try any free slot before giving up.
      try {
        await joinEvent({ eventId, participant });
        added++;
      } catch (retryError) {
        if (errorCode(retryError) === "EVENT_FULL") break;
        if (errorCode(retryError) !== "DUPLICATE") throw retryError;
      }
    }
  }
  return added;
}
