import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "../services/firebaseAdmin";
import { HttpError } from "./http";

/**
 * Reads the Firebase ID token from the Authorization header and verifies it.
 * Returns null when the request carries no token (public callers).
 */
export async function getUser(request: Request): Promise<DecodedIdToken | null> {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  try {
    return await adminAuth.verifyIdToken(match[1]);
  } catch {
    throw new HttpError(401, "Your session has expired. Please sign in again.", "INVALID_TOKEN");
  }
}

/** Same as getUser but rejects unauthenticated requests. */
export async function requireUser(request: Request): Promise<DecodedIdToken> {
  const user = await getUser(request);
  if (!user) throw new HttpError(401, "Please sign in to continue.", "UNAUTHENTICATED");
  return user;
}

export function isAnonymous(user: DecodedIdToken): boolean {
  return user.firebase?.sign_in_provider === "anonymous";
}
