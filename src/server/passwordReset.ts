import { createHash, randomInt, timingSafeEqual } from "crypto";
import { adminAuth, adminDb } from "../services/firebaseAdmin";
import { HttpError } from "./http";

/**
 * Password reset by a 6-digit code sent to the account's email.
 *
 * Only a hash of the code is stored. A code works for 15 minutes and allows a few wrong
 * guesses before it is cancelled, which keeps a 6-digit code safe against guessing.
 * Works for every account, including ones created with Google: they gain a password.
 */

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_WRONG_GUESSES = 5;
export const RESET_CODE_MINUTES = CODE_TTL_MS / 60000;

const normalise = (email: string) => email.trim().toLowerCase();
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const resetRef = (email: string) => adminDb.collection("PasswordResets").doc(sha(normalise(email)));
const hashCode = (email: string, code: string) => sha(`${normalise(email)}:${code}`);

/** Looks an account up by email. Returns null instead of throwing when there is none. */
async function findAccount(email: string) {
  try {
    return await adminAuth.getUserByEmail(normalise(email));
  } catch (err) {
    if ((err as { code?: string }).code === "auth/user-not-found") return null;
    throw err;
  }
}

/**
 * Creates a reset code for the account with this email.
 * Returns null when no such account exists; the caller must not reveal that to the requester.
 */
export async function createResetCode(email: string): Promise<{ code: string; name: string } | null> {
  const account = await findAccount(email);
  if (!account || account.disabled) return null;

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = Date.now() + CODE_TTL_MS;
  await resetRef(email).set({
    codeHash: hashCode(email, code),
    wrongGuesses: 0,
    expiresAt,
    // Enable a Firestore TTL policy on PasswordResets.expireTime to clean these up automatically.
    expireTime: new Date(expiresAt),
  });
  // Accounts created with email and password keep their name on the profile, not on the login record.
  const profile = (await adminDb.collection("Users").doc(account.uid).get()).data();
  const name = String(profile?.firstName || account.displayName?.split(" ")[0] || "").trim();
  return { code, name };
}

const INVALID = () =>
  new HttpError(400, "That code is not correct or has expired. Check the code or request a new one.", "INVALID_CODE");

/** Checks a code without using it up. Wrong guesses are counted; too many cancel the code. */
export async function verifyResetCode(email: string, code: string): Promise<void> {
  const ref = resetRef(email);
  const outcome = await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();
    if (!data || data.expiresAt < Date.now()) return "invalid";
    if (data.wrongGuesses >= MAX_WRONG_GUESSES) return "locked";

    const expected = Buffer.from(String(data.codeHash));
    const given = Buffer.from(hashCode(email, code));
    if (expected.length === given.length && timingSafeEqual(expected, given)) return "ok";

    tx.update(ref, { wrongGuesses: data.wrongGuesses + 1 });
    return data.wrongGuesses + 1 >= MAX_WRONG_GUESSES ? "locked" : "invalid";
  });

  if (outcome === "locked") {
    throw new HttpError(429, "Too many wrong attempts. Please request a new code.", "CODE_LOCKED");
  }
  if (outcome !== "ok") throw INVALID();
}

/** Sets the new password with a valid code, then cancels the code and signs out other sessions. */
export async function resetPasswordWithCode(email: string, code: string, password: string): Promise<void> {
  await verifyResetCode(email, code);
  const account = await findAccount(email);
  if (!account) throw INVALID();

  await adminAuth.updateUser(account.uid, { password });
  await Promise.all([resetRef(email).delete(), adminAuth.revokeRefreshTokens(account.uid)]);
}
