import { createHash, timingSafeEqual } from "crypto";
import { EVENT_RETENTION_MONTHS } from "@/content/legal";
import { adminDb } from "../services/firebaseAdmin";
import { purgeOrganization } from "./deletion";
import { allParticipants, type EventDoc } from "./events";

/**
 * The daily cleanup promised in the Privacy Policy: events with no activity for
 * EVENT_RETENTION_MONTHS are deleted, and organizations whose waiting period has ended are purged.
 *
 * Each run handles a bounded number of documents so it finishes well inside a serverless
 * time limit. Anything left over is picked up by the next day's run.
 */

const EVENTS_PER_RUN = 200;
const ORGS_PER_RUN = 5;

/** The moment before which an untouched event counts as inactive. */
export function retentionCutoff(now = Date.now()): number {
  const date = new Date(now);
  date.setMonth(date.getMonth() - EVENT_RETENTION_MONTHS);
  return date.getTime();
}

/** When an event was last created, changed or joined. */
export function lastActivity(event: EventDoc): number {
  const times = [event.createdAt, event.updatedAt, event.lastActivityAt];
  for (const { participant } of allParticipants(event)) times.push(participant.joinedAt);
  return Math.max(0, ...times.filter((t): t is number => typeof t === "number" && Number.isFinite(t)));
}

/** Deletes events with no activity since the cutoff. Returns how many matched. */
export async function purgeInactiveEvents(now = Date.now(), dryRun = false): Promise<number> {
  const cutoff = retentionCutoff(now);
  // Activity never predates creation, so only events created before the cutoff can qualify.
  const old = await adminDb.collection("Pairings").where("createdAt", "<", cutoff).limit(EVENTS_PER_RUN).get();
  const inactive = old.docs.filter((d) => lastActivity(d.data() as EventDoc) < cutoff);
  if (!dryRun) await Promise.all(inactive.map((d) => d.ref.delete()));
  return inactive.length;
}

/** Permanently deletes organizations whose deletion date has passed. Returns how many matched. */
export async function purgeDueOrganizations(now = Date.now(), dryRun = false): Promise<number> {
  const due = await adminDb
    .collection("Organizations")
    .where("deletionScheduledFor", "<=", now)
    .limit(ORGS_PER_RUN)
    .get();
  if (!dryRun) {
    for (const doc of due.docs) await purgeOrganization(doc.id);
  }
  return due.docs.length;
}

/**
 * The token the scheduled job must present. It is derived from the server's service account,
 * a secret both the job and this server already hold, so no extra setting is needed.
 * Returns null when that secret is not a real key (for example a file path on a developer machine).
 */
export function cleanupToken(): string | null {
  const secret = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim() || "";
  if (secret.length < 200) return null;
  return createHash("sha256").update(`pairform-cleanup:${secret}`).digest("hex");
}

export function isCleanupToken(given: string): boolean {
  const expected = cleanupToken();
  if (!expected || given.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}
