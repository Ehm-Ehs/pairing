import { errorCode, errorMessage } from "./errors";

const GENERIC = "An unexpected error occurred. Please try again.";

/** Friendly text for the Firebase Auth error codes users can actually run into. */
const MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "Invalid email or password. Please try again.",
  "auth/user-not-found": "No account found with this email. Please sign up.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "An account with this email already exists. Please log in.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
  "auth/popup-blocked": "Your browser blocked the sign-in popup. Please allow popups for this site and try again.",
  "auth/unauthorized-domain":
    "Google sign-in is not available on this site right now. Please use your email and password, or contact support.",
  "auth/account-exists-with-different-credential":
    "An account already exists with the same email using a different sign-in method.",
  "auth/network-request-failed": "Network error. Please check your internet connection and try again.",
  "auth/too-many-requests": "Too many failed attempts. Please try again later.",
  "auth/user-disabled": "This account has been disabled. Please contact support.",
  "auth/operation-not-allowed": "This sign-in method is not available right now. Please try another way to sign in.",
};

/**
 * Maps a Firebase error to a message that is safe to show a user.
 * Raw Firebase codes are never shown; callers log the original error for debugging.
 */
export const getFriendlyFirebaseErrorMessage = (error: unknown): string => {
  if (!error) return GENERIC;

  const code = errorCode(error);
  if (code && MESSAGES[code]) return MESSAGES[code];

  const message = errorMessage(error);
  if (code || message.includes("Firebase")) return "Authentication failed. Please try again.";
  return message || GENERIC;
};
