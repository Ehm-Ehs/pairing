import { useCallback, useEffect, useRef, useState } from "react";
import { signInWithPopup, signInWithRedirect, getRedirectResult, User } from "firebase/auth";
import { toast } from "react-toastify";
import { auth, googleProvider } from "../services/firebase";
import { errorCode, errorMessage, errorStatus } from "../utils/errors";
import { getFriendlyFirebaseErrorMessage } from "../utils/firebaseErrorUtils";
import { logger } from "../utils/logger";

const TOAST = { position: "top-center" as const };

/**
 * Google refuses to sign people in from browsers embedded inside other apps
 * (the preview pane of a code editor, or the in-app browser of a social or chat app).
 */
const isEmbeddedBrowser = () =>
  typeof navigator !== "undefined" &&
  /Electron|FBAN|FBAV|Instagram|Line\/|; wv\)|WhatsApp|Snapchat|TikTok/i.test(navigator.userAgent);

/**
 * A redirect sign-in only completes when the Firebase auth page is served from the same site
 * as the app. Otherwise the browser's storage partitioning discards the result and the user
 * lands back on the login page, signed out, with no error.
 */
const redirectCanComplete = () =>
  typeof window !== "undefined" && auth.config.authDomain === window.location.host;

const POPUP_BLOCKED = new Set(["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"]);
/** The user closed or replaced the popup themselves; nothing to report. */
const POPUP_DISMISSED = new Set(["auth/popup-closed-by-user", "auth/cancelled-popup-request", "auth/user-cancelled"]);

/**
 * Google sign-in shared by the login and sign-up screens.
 * `onSignedIn` runs once Google has authenticated the user.
 */
export function useGoogleAuth(onSignedIn: (user: User) => Promise<void>) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const handler = useRef(onSignedIn);
  useEffect(() => {
    handler.current = onSignedIn;
  });

  const report = (error: unknown) => {
    logger.error("Google sign-in error:", errorCode(error) || errorStatus(error), error);
    // Errors from our own API already carry a message written for users.
    const message = errorStatus(error) ? errorMessage(error) : getFriendlyFirebaseErrorMessage(error);
    toast.error(message, TOAST);
  };

  // Completes a sign-in that was started with a redirect.
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) await handler.current(result.user);
      })
      .catch(report);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (isSigningIn) return;

    if (isEmbeddedBrowser()) {
      toast.error(
        "Google sign-in does not work inside this in-app browser. Open the page in Chrome or Safari, or use your email and password.",
        { ...TOAST, autoClose: 8000 }
      );
      return;
    }

    setIsSigningIn(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handler.current(result.user);
    } catch (error) {
      const code = errorCode(error) || "";
      if (POPUP_DISMISSED.has(code)) return;

      if (POPUP_BLOCKED.has(code)) {
        if (redirectCanComplete()) {
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        toast.error(
          "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again, or use your email and password.",
          { ...TOAST, autoClose: 8000 }
        );
        return;
      }
      report(error);
    } finally {
      setIsSigningIn(false);
    }
  }, [isSigningIn]);

  return { signInWithGoogle, isSigningIn };
}
