import { signOut, type User } from "firebase/auth";
import { auth } from "./firebase";
import { logger } from "../utils/logger";
import Auth from "./auth.module";
import { apiFetch } from "./api";

export interface BootstrapResult {
  success: boolean;
  /** True when this call created the profile (a new account). */
  created: boolean;
  migratedEvents: number;
  welcomeEmailSent: boolean;
}

/**
 * Finishes a sign-in or sign-up. The server creates the profile and free token grant
 * if they do not exist yet and sends the welcome email for new accounts.
 */
export async function completeSignIn(
  user: User,
  profile: { firstName?: string; lastName?: string } = {}
): Promise<BootstrapResult> {
  const result = await apiFetch<BootstrapResult>("/api/users/bootstrap", {
    auth: "required",
    body: profile,
  });
  Auth.storeUser({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || null,
    photoURL: user.photoURL,
  });
  return result;
}

/** Signs the user out and returns to the landing page with a full reload, clearing in-memory state. */
export async function signOutAndGoHome(): Promise<void> {
  try {
    await signOut(auth);
    Auth.deAuthenticateUser();
    // A full page load on purpose: it drops every piece of in-memory state for the old session.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  } catch (error) {
    logger.error("Error signing out:", error);
  }
}
