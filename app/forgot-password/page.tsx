"use client";

import { useState } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../src/services/firebase";
import Link from "next/link";
import Logo from "../../src/assets/logo";
import { toast } from "react-toastify";
import { Button } from "../../src/components/ui/button";
import { getFriendlyFirebaseErrorMessage } from "../../src/utils/firebaseErrorUtils";

const ForgotPassword = () => {
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (
    values: { email: string },
    { setSubmitting }: any
  ) => {
    try {
      await sendPasswordResetEmail(auth, values.email);
      setIsSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast.error(getFriendlyFirebaseErrorMessage(error));
    } finally {
      setSubmitting(false);
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

      <div className="bg-white p-6 md:p-10 mt-5 rounded shadow-xl w-full max-w-md text-left">
        <div className="text-black text-2xl mb-6 text-center">
          <p className="text-2xl pb-2 font-medium">Reset Password</p>
          <p className="text-sm text-gray-600">
            Enter your email to receive password reset instructions
          </p>
        </div>

        {isSent ? (
          <div className="text-center">
            <p className="text-green-600 mb-6 bg-green-50 p-4 rounded-md">
              Check your email for a link to reset your password. If it doesn't
              appear within a few minutes, check your spam folder.
            </p>
            <Link href="/login">
              <Button className="w-full bg-blue-700 hover:bg-blue-800">
                Back to Login
              </Button>
            </Link>
          </div>
        ) : (
          <Formik
            initialValues={{ email: "" }}
            validationSchema={Yup.object({
              email: Yup.string()
                .email("Invalid email format")
                .required("Required"),
            })}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="flex flex-col gap-4">
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
                    <div className="text-red-500 text-sm mt-1">
                      {errors.email}
                    </div>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-blue-700 hover:bg-blue-800 w-full"
                >
                  Send Reset Link
                </Button>

                <div className="mt-4 text-center">
                  <Link
                    href="/login"
                    className="text-sm text-blue-700 hover:underline"
                  >
                    &larr; Back to Login
                  </Link>
                </div>
              </Form>
            )}
          </Formik>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
