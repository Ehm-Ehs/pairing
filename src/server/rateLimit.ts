import { createHash } from "crypto";
import { adminDb } from "../services/firebaseAdmin";
import { HttpError } from "./http";

/**
 * Fixed-window rate limiter backed by Firestore so it holds across serverless instances.
 * Throws a 429 HttpError once `limit` calls have been made for `key` inside the window.
 *
 * Documents carry an `expiresAt` timestamp; enable a Firestore TTL policy on
 * RateLimits.expiresAt to have old windows cleaned up automatically.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const id = createHash("sha256").update(key).digest("hex").slice(0, 40);
  const ref = adminDb.collection("RateLimits").doc(id);
  const now = Date.now();

  const allowed = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!snap.exists || !data || now >= data.resetAt) {
      const resetAt = now + windowSeconds * 1000;
      tx.set(ref, { count: 1, resetAt, expiresAt: new Date(resetAt + 60_000) });
      return true;
    }
    if (data.count >= limit) return false;
    tx.update(ref, { count: data.count + 1 });
    return true;
  });

  if (!allowed) {
    throw new HttpError(429, "Too many requests. Please wait a moment and try again.", "RATE_LIMITED");
  }
}
