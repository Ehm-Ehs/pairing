import { errorCode, errorMessage, errorStatus } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  User,
} from "firebase/auth";
import { toast } from "react-toastify";
import { auth } from "../services/firebase";
import { completeSignIn } from "../services/session";
import { acceptOrgInvite } from "../services/orgService";
import { getFriendlyFirebaseErrorMessage } from "../utils/firebaseErrorUtils";
import { useGoogleAuth } from "./useGoogleAuth";

const TOAST = { position: "top-center" as const, autoClose: 3000 };

export const useSignup = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken") || searchParams.get("token") || "";
  const redirectUrl = searchParams.get("redirect") || "/home";


  /** Shared tail of every sign-up path: create the profile on the server, then accept any invite. */
  const finish = async (user: User, profile: { firstName?: string; lastName?: string }, successMessage: string) => {
    const result = await completeSignIn(user, profile);

    if (inviteToken) {
      const accepted = await acceptOrgInvite(inviteToken);
      if (!accepted.success) toast.warning(accepted.error || "We could not accept your organization invite.");
    }
    if (result.created && !result.welcomeEmailSent && user.email) {
      toast.warning("Account created, but we couldn't send the welcome email.");
    }
    toast.success(result.created ? successMessage : "Welcome back! You already have an account.", TOAST);
    router.push(redirectUrl);
  };

  const { signInWithGoogle, isSigningIn } = useGoogleAuth((user) => finish(user, {}, "Sign up successful!"));

  const handleSubmit = async (values: { email: string; password: string; firstName: string; lastName: string }) => {
    const profile = { firstName: values.firstName, lastName: values.lastName };
    try {
      let user: User;
      let linked = false;

      if (auth.currentUser?.isAnonymous) {
        // A guest is signing up: keep their session and data, attach the new credentials.
        const credential = EmailAuthProvider.credential(values.email, values.password);
        user = (await linkWithCredential(auth.currentUser, credential)).user;
        await user.getIdToken(true); // refresh so the server sees a registered account
        linked = true;
      } else {
        user = (await createUserWithEmailAndPassword(auth, values.email, values.password)).user;
      }

      await finish(user, profile, linked ? "Account created and data migrated successfully!" : "Sign up successful!");
    } catch (error) {
      logger.error("Error signing up:", errorCode(error) || error);

      if (errorCode(error) === "auth/email-already-in-use") {
        // The email is registered. If the password matches, sign them in and repair the profile if needed.
        try {
          const { user } = await signInWithEmailAndPassword(auth, values.email, values.password);
          await finish(user, profile, "Account recovered and logged in successfully!");
        } catch {
          toast.error("Email already in use. Please log in or reset password.", { position: "top-center" });
        }
        return;
      }
      toast.error(errorMessage(error) && errorStatus(error) ? errorMessage(error) : getFriendlyFirebaseErrorMessage(error), {
        position: "top-center",
      });
    }
  };

  return {
    handleGoogleSignUp: signInWithGoogle,
    handleSubmit,
    isGoogleSigningUp: isSigningIn,
  };
};
