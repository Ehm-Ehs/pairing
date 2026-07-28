"use client";

import { Formik, Form } from "formik";
import * as Yup from "yup";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
} from "firebase/auth";
import { auth, googleProvider, db } from "../../../src/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../../../src/assets/logo";
import Auth from "../../../src/services/auth.module";
import { toast } from "react-toastify";
import { FaGoogle, FaEye, FaEyeSlash } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { sendWelcomeEmail } from "../../../src/services/email";
import { Button } from "../../../src/components/ui/button";
import { getFriendlyFirebaseErrorMessage } from "../../../src/utils/firebaseErrorUtils";
import { useState } from "react";

const LoginForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const docRef = doc(db, "Users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const userId = uuidv4();
        await setDoc(docRef, {
          userId,
          email: user.email,
          firstName: user.displayName?.split(" ")[0] || "",
          lastName: user.displayName?.split(" ").slice(1).join(" ") || "",
        });

        if (user.email) {
          const emailResult = await sendWelcomeEmail(
            user.email,
            user.displayName || "User"
          );
          if (!emailResult?.success) {
            console.warn("Failed to send welcome email during Google login");
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

  const handleAnonymousSignIn = async () => {
    try {
      const result = await signInAnonymously(auth);
      const user = result.user;

      const docRef = doc(db, "Users", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const userId = uuidv4();
        await setDoc(docRef, {
          userId,
          email: null,
          firstName: "Guest",
          lastName: "User",
          isAnonymous: true,
          createdAt: new Date().toISOString(),
        });
      }

      const accessToken = await user.getIdToken();
      if (accessToken && user) {
        const userToStore = {
          uid: user.uid,
          email: null,
          displayName: "Guest User",
          photoURL: null,
        };
        // @ts-ignore
        Auth.authenticateUser({ accessToken, data: userToStore });
        toast.success("Logged in as Guest!", {
          position: "top-center",
          autoClose: 3000,
        });
        router.push("/home");
      }
    } catch (error: any) {
      console.error("Error signing in as guest:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error), {
        position: "top-center",
      });
    }
  };

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      const response = await signInWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
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
      } else {
        toast.error("Failed to retrieve login details. Please try again.", {
          position: "top-center",
        });
      }
    } catch (error: any) {
      console.error("Error logging in:", error.message);
      toast.error(getFriendlyFirebaseErrorMessage(error), {
        position: "top-center",
      });
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 w-full min-h-screen bg-[#f3f4f6] text-black py-12 font-sora">
      <Link href="/">
        <Logo className="h-9 w-auto mb-6" />
      </Link>
      <div className="w-full max-w-xl bg-white border-t-[6px] border-[#0c3886] rounded-[2.5rem] shadow-xl overflow-hidden mt-2">
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
          {({ values, errors, touched, handleChange, handleBlur, isSubmitting }) => (
            <Form className="flex flex-col gap-5 p-8 md:p-12">
              <div className="text-black text-center mb-4">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Login</h1>
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
                  <Link href="/sign-up" className="text-[#1449b2] font-semibold hover:underline">
                    Create an Account
                  </Link>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g John@example.com"
                  className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.email && touched.email && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.email}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder=""
                    className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors pr-10"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
                {errors.password && touched.password && (
                  <div className="text-red-500 text-xs mt-1">
                    {errors.password}
                  </div>
                )}

                <div className="flex justify-end mt-2">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#1449b2] font-semibold hover:underline"
                  >
                    Forgot your Password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full bg-[#1449b2] hover:bg-[#0f3d99] text-white rounded-full py-4 text-base font-semibold shadow-md transition-colors mt-2"
              >
                Sign in
              </Button>

              <div className="flex items-center my-2">
                <div className="flex-1 border-t border-gray-100"></div>
                <span className="px-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">Or</span>
                <div className="flex-1 border-t border-gray-100"></div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 hover:bg-gray-50 bg-white text-gray-700 border border-gray-200 rounded-full py-3.5 font-semibold text-sm transition-colors shadow-sm"
              >
                <FaGoogle className="text-red-500 text-base" />
                Sign in with Google
              </Button>

              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={handleAnonymousSignIn}
                  className="text-sm text-gray-700 font-semibold underline hover:text-black cursor-pointer"
                >
                  Sign in Anonymously
                </button>
              </div>
            </Form>
          )}
        </Formik>

        <div className="bg-[#f3f4f6] px-8 py-6 flex justify-center border-t border-gray-100">
          <Link
            href="/"
            className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 font-semibold px-12 py-2.5 rounded-full text-sm transition-colors shadow-sm"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
