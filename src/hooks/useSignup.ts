import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { auth, db, googleProvider } from "../services/firebase";
import Auth from "../services/auth.module";
import { sendWelcomeEmail } from "../services/email";
import { getFriendlyFirebaseErrorMessage } from "../utils/firebaseErrorUtils";

export const useSignup = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isGoogleSigningUp, setIsGoogleSigningUp] = useState(false);

  const handleGoogleSignUp = async () => {
    if (isGoogleSigningUp) return;
    setIsGoogleSigningUp(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const docRef = doc(db, "Users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const userId = uuidv4();
        // Create new user if not exists
        await setDoc(docRef, {
          userId,
          email: user.email,
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        });

        // Send welcome email
        if (user.email) {
          const emailResult = await sendWelcomeEmail(
            user.email,
            user.displayName || "User"
          );
          if (!emailResult?.success) {
            console.warn("Failed to send welcome email during Google signup");
            toast.warning(
              "Account created, but we couldn't send the welcome email."
            );
          }
        }
      }

      const accessToken = await user.getIdToken();
      if (accessToken && user) {
        const userToStore = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        Auth.authenticateUser({ accessToken, data: userToStore });
        toast.success("Sign up successful!", {
          position: "top-center",
          autoClose: 3000,
        });
        router.push("/home");
      }
    } catch (error: any) {
      console.error("Error signing up with Google:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error), {
        position: "top-center",
      });
    } finally {
      setIsGoogleSigningUp(false);
    }
  };

  const handleSubmit = async (values: {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
  }) => {
    console.log("Form Values:", values);

    // Generate a UUID and include it in the form data
    const userId = uuidv4();

    try {
      let user;
      let isLinked = false;

      if (auth.currentUser && auth.currentUser.isAnonymous) {
        try {
          const credential = EmailAuthProvider.credential(
            values.email,
            values.password
          );
          const userCredential = await linkWithCredential(
            auth.currentUser,
            credential
          );
          user = userCredential.user;
          isLinked = true;
          console.log("Anonymous user linked successfully:", user);
        } catch (linkError: any) {
          console.error("Error linking anonymous user, trying standard signup:", linkError);
          throw linkError;
        }
      }

      if (!isLinked) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        user = userCredential.user;
        console.log("User signed up:", user);
      }

      const accessToken = await user.getIdToken();

      if (accessToken && user) {
        const userToStore = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || `${values.firstName} ${values.lastName}`.trim(),
          photoURL: user.photoURL,
        };
        Auth.authenticateUser({ accessToken, data: userToStore });

        // Update or create the Firestore document
        const userDocRef = doc(db, "Users", user.uid);
        if (isLinked) {
          await setDoc(
            userDocRef,
            {
              email: user.email,
              firstName: values.firstName,
              lastName: values.lastName,
              isAnonymous: false,
            },
            { merge: true }
          );
        } else {
          await setDoc(userDocRef, {
            userId, // Add the UUID here
            email: user.email,
            firstName: values.firstName,
            lastName: values.lastName,
            isAnonymous: false,
          });
        }

        // Send welcome email
        const emailResult = await sendWelcomeEmail(
          values.email,
          values.firstName
        );

        if (!emailResult?.success) {
          console.warn("Failed to send welcome email:", emailResult?.error);
          toast.warning(
            "Account created, but we couldn't send the welcome email. Please check your email settings."
          );
        }

        toast.success(isLinked ? "Account created and data migrated successfully!" : "Sign up successful!", {
          position: "top-center",
          autoClose: 3000,
        });

        router.push("/home");
      } else {
        toast.error("Failed to retrieve login details. Please try again.", {
          position: "top-center",
          autoClose: 3000,
        });
      }
    } catch (error: any) {
      console.error("Error signing up:", error);
      if (error.code === "auth/email-already-in-use") {
        try {
          // Attempt to sign in
          const userCredential = await signInWithEmailAndPassword(
            auth,
            values.email,
            values.password
          );
          const user = userCredential.user;

          // Check if document exists
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);

          if (!docSnap.exists()) {
            // Recreate document (Healing orphaned account)
            await setDoc(docRef, {
              userId,
              email: user.email,
              firstName: values.firstName,
              lastName: values.lastName,
            });

            // Send welcome email
            const emailResult = await sendWelcomeEmail(
              values.email,
              values.firstName
            );

            if (!emailResult?.success) {
              console.warn("Failed to send welcome email during recovery");
              toast.warning(
                "Account recovered, but we couldn't send the welcome email."
              );
            }

            const accessToken = await user.getIdToken();
            if (accessToken && user) {
              const userToStore = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              };
              Auth.authenticateUser({ accessToken, data: userToStore });
              toast.success("Account recovered and logged in successfully!", {
                position: "top-center",
                autoClose: 3000,
              });
              router.push("/home");
            }
          } else {
            toast.error("Account already exists. Please log in.", {
              position: "top-center",
            });
          }
        } catch (signInError: any) {
          console.error("Error signing in during recovery:", signInError);
          // Likely wrong password for existing account
          toast.error(
            "Email already in use. Please log in or reset password.",
            {
              position: "top-center",
            }
          );
        }
      } else {
        toast.error(getFriendlyFirebaseErrorMessage(error), {
          position: "top-center",
        });
      }
    }
  };

  return {
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleGoogleSignUp,
    handleSubmit,
    isGoogleSigningUp,
  };
};
