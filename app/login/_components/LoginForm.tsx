"use client";

import { PasswordInput } from "@/components/ui/PasswordInput";
import { errorCode, errorMessage, errorStatus } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { signInWithEmailAndPassword, User } from "firebase/auth";
import { auth } from "@/services/firebase";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "@/assets/logo";
import { toast } from "react-toastify";
import { FaGoogle } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { getFriendlyFirebaseErrorMessage } from "@/utils/firebaseErrorUtils";
import { completeSignIn } from "@/services/session";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("inviteToken");
  // Someone following an org invite returns to it after logging in.
  const redirectUrl = inviteToken ? `/invite/${inviteToken}` : searchParams.get("redirect") || "/home";
  // Carry "where to go next" (and any invite) across to the sign-up page.
  const queryToKeep = searchParams.toString() ? `?${searchParams.toString()}` : "";

  /** Creates the profile on the server if needed, then continues to the app. */
  const finish = async (user: User) => {
    try {
      await completeSignIn(user);
    } catch (error) {
      // Signing in succeeded; only the profile sync failed. The app retries it once loaded.
      logger.error("Account setup did not complete:", error);
    }
    toast.success("Login successful!", { position: "top-center", autoClose: 3000 });
    router.push(redirectUrl);
  };

  const { signInWithGoogle: handleGoogleSignIn } = useGoogleAuth(finish);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      const { user } = await signInWithEmailAndPassword(auth, values.email, values.password);
      await finish(user);
    } catch (error) {
      logger.error("Error logging in:", errorCode(error) || errorMessage(error));
      toast.error(errorStatus(error) ? errorMessage(error) : getFriendlyFirebaseErrorMessage(error), {
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
                  <Link href={`/sign-up${queryToKeep}`} className="text-[#1449b2] font-semibold hover:underline">
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
                <PasswordInput
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
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
