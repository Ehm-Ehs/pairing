"use client";

import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../../src/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../../src/assets/logo";
import Auth from "../../src/services/auth.module";
import { toast } from "react-toastify";
import { FaGoogle } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { sendWelcomeEmail } from "../../src/services/email";
import { Button } from "../../src/components/ui/button";
import { getFriendlyFirebaseErrorMessage } from "../../src/utils/firebaseErrorUtils";

const SignIn = () => {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
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
            console.warn("Failed to send welcome email during Google login");
            toast.warning("Welcome email could not be sent.");
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
        toast.success("Login successful!", {
          position: "top-center",
          autoClose: 3000,
        });
        router.push("/home");
      }
    } catch (error: any) {
      console.error("Error logging in with Google:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error), {
        position: "top-center",
      });
    }
  };

  const handleSubmit = async (values: { email: string; password: string }) => {
    console.log("Form Values:", values);
    try {
      const response = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      console.log("User logged in successfully:", response);

      const { user } = response;

      const docRef = doc(db, "Users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await auth.signOut();
        toast.error("Account details not found. Please sign up.", {
          position: "top-center",
        });
        router.push("/sign-up");
        return;
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

        toast.success("Login successful!", {
          position: "top-center",
          autoClose: 3000,
        });

        router.push("/home");
        console.log("nav");
      } else {
        toast.error("Failed to retrieve login details. Please try again.", {
          position: "top-center",
        });
      }
    } catch (error: any) {
      console.error("Error logging in:", error.message);

      // Show error toast message
      toast.error(getFriendlyFirebaseErrorMessage(error), {
        position: "top-center",
      });
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 w-full min-h-screen bg-white text-black">
      <div className="flex items-center gap-2 py-5">
        <div className="w-10 h-10">
          <Logo />
        </div>
        <p className="pt-3 font-semibold">Pair Form</p>
      </div>
      <Formik
        initialValues={{ email: "", password: "" }}
        validationSchema={Yup.object({
          email: Yup.string()
            .email("Invalid email format")
            .required("Required"),
          password: Yup.string().required("Required"),
        })}
        onSubmit={handleSubmit}
      >
        {({ errors, touched }) => (
          <Form className="flex flex-col gap-4 bg-white p-6 md:p-10 mt-5 rounded shadow-xl w-full max-w-md text-left">
            <div className="text-black text-2xl mb-6 text-center">
              <p className="text-2xl pb-2 font-medium">Login</p>
              <p className="text-sm text-gray-600">
                Add your details to get back into the app
              </p>
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <Field
                type="email"
                name="email"
                placeholder="Email"
                className="p-2 w-full bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.email && touched.email ? (
                <div className="text-red-500 text-sm mt-1">{errors.email}</div>
              ) : null}
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-blue-700 hover:text-blue-800"
                >
                  Forgot Password?
                </Link>
              </div>
              <Field
                type="password"
                name="password"
                placeholder="Password"
                className="p-2 w-full bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {errors.password && touched.password ? (
                <div className="text-red-500 text-sm mt-1">
                  {errors.password}
                </div>
              ) : null}
            </div>
            <Button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 w-full"
            >
              Sign In
            </Button>

            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-gray-500 text-sm">Or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <Button
              type="button"
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 hover:bg-gray-50 bg-white"
            >
              <FaGoogle className="text-red-500" />
              Sign in with Google
            </Button>

            <p className="py-4 text-center">
              Don't have an account?
              <Link href="/sign-up" className="text-blue-700">
                Create an account
              </Link>
            </p>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default SignIn;
