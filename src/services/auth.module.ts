import { logger } from "@/utils/logger";
import { auth } from "./firebase";

export interface StoredUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const USER_KEY = "user";
/** Keys written by older versions. The ID token is no longer stored anywhere by the app. */
const LEGACY_KEYS = ["token", "organization"];

/**
 * Small local cache of the signed-in user's public profile, used for instant UI hints.
 * Firebase Auth is the source of truth for the session; API calls read the ID token
 * directly from Firebase (see services/api.ts).
 */
class Auth {
  static storeUser(user: StoredUser): void {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      logger.error("Error while storing user data:", error);
    }
  }

  static deAuthenticateUser(): void {
    try {
      localStorage.removeItem(USER_KEY);
      LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      logger.error("Error while de-authenticating user:", error);
    }
  }

  /** True when Firebase has a session, or had one on the last visit (before auth finishes loading). */
  static isUserAuthenticated(): boolean {
    if (auth.currentUser) return true;
    try {
      return Boolean(localStorage.getItem(USER_KEY));
    } catch {
      return false;
    }
  }
}

export default Auth;
