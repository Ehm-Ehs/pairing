import { logger } from "@/utils/logger";
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { existsSync, readFileSync } from "fs";

/**
 * Server-only Firebase Admin initialisation.
 *
 * One variable holds the service account in every environment: FIREBASE_SERVICE_ACCOUNT_KEY.
 * Each environment (your machine, the develop site, production) sets it to the key of the
 * Firebase project that environment uses. A key only works for the project it came from.
 */
/** The Firebase project the browser talks to in this environment. The server key must match it. */
const expectedProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/**
 * Reads the service account from FIREBASE_SERVICE_ACCOUNT_KEY, which may hold:
 *   - the JSON itself,
 *   - the JSON base64-encoded (safest for hosting dashboards), or
 *   - a path to the downloaded .json key file (handy on your own machine).
 */
function parseServiceAccount(): { account?: Record<string, unknown>; problem?: string } {
  const value = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!value) {
    return {
      problem:
        "The server has no Firebase service account. Download a key from Firebase console > Project settings > " +
        "Service accounts, then set FIREBASE_SERVICE_ACCOUNT_KEY in .env.local to the file's path or its JSON content, " +
        "and restart the server.",
    };
  }

  try {
    if (value.startsWith("{")) return { account: JSON.parse(value) };
    if (value.endsWith(".json")) {
      if (!existsSync(value)) {
        return {
          problem: `FIREBASE_SERVICE_ACCOUNT_KEY points to "${value}" but that file does not exist. Download the key from Firebase console > Project settings > Service accounts and save it there.`,
        };
      }
      return { account: JSON.parse(readFileSync(value, "utf8")) };
    }
    return { account: JSON.parse(Buffer.from(value, "base64").toString("utf8")) };
  } catch {
    return {
      problem:
        "FIREBASE_SERVICE_ACCOUNT_KEY could not be read. It must be the service account JSON, that JSON base64-encoded, or the path to the .json key file.",
    };
  }
}

const parsed = parseServiceAccount();
const keyProjectId = parsed.account?.project_id as string | undefined;

// A key for a different project would reject every sign-in and write data to the wrong place,
// so the server refuses to use it at all.
const mismatch =
  keyProjectId && expectedProjectId && keyProjectId !== expectedProjectId
    ? `FIREBASE_SERVICE_ACCOUNT_KEY is for the Firebase project "${keyProjectId}", but this environment uses ` +
      `"${expectedProjectId}" (NEXT_PUBLIC_FIREBASE_PROJECT_ID). Use the service account from "${expectedProjectId}".`
    : undefined;

const serviceAccount = mismatch ? undefined : parsed.account;
const problem = mismatch || parsed.problem;

/**
 * True when the server can reach Firestore: a service account is configured, or the
 * platform provides default credentials (GOOGLE_APPLICATION_CREDENTIALS or Google hosting).
 */
export const hasAdminCredentials =
  !mismatch && (!!serviceAccount || !!process.env.GOOGLE_APPLICATION_CREDENTIALS || !!process.env.K_SERVICE);

/** What is wrong with the server's Firebase credentials and how to fix it. */
export const ADMIN_SETUP_HINT = problem || "The server's Firebase credentials are not configured.";

function getAdminApp(): App {
  // The app is named after the credentials it was built with. In development the module can be
  // re-evaluated after .env.local changes while old app instances survive; this makes sure a new
  // key is picked up instead of reusing an app created without credentials.
  const name = `admin-${(serviceAccount?.private_key_id as string | undefined) || "no-key"}`;
  const existing = getApps().find((app) => app.name === name);
  if (existing) return existing;

  const projectId = (serviceAccount?.project_id as string | undefined) || expectedProjectId;

  if (!serviceAccount) {
    if (!hasAdminCredentials) logger.warn(`[firebaseAdmin] ${ADMIN_SETUP_HINT}`);
    return initializeApp({ projectId }, name);
  }

  return initializeApp({ credential: cert(serviceAccount as never), projectId }, name);
}

const adminApp = getAdminApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
