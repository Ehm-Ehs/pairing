"use client";
import Link from "next/link";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { useSearchParams } from "next/navigation";
import { useSignup } from "../../../src/hooks/useSignup";
import { Button } from "../../../src/components/ui/button";

const SignupForm = () => {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const nameParam = searchParams.get("name") || "";

  const nameParts = nameParam.trim().split(/\s+/);
  const firstNameParam = nameParts[0] || "";
  const lastNameParam = nameParts.slice(1).join(" ") || "";

  const {
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleGoogleSignUp,
    handleSubmit,
    isGoogleSigningUp,
  } = useSignup();

  return (
    <Formik
      initialValues={{
        email: emailParam,
        password: "",
        confirmPassword: "",
        firstName: firstNameParam,
        lastName: lastNameParam,
      }}
      enableReinitialize={true}
      validationSchema={Yup.object({
        email: Yup.string().email("Invalid email format").required("Required"),
        password: Yup.string()
          .min(6, "Password must be at least 6 characters")
          .required("Required"),
        confirmPassword: Yup.string()
          .oneOf([Yup.ref("password")], "Passwords must match")
          .required("Required"),
        firstName: Yup.string().required("First Name is required"),
        lastName: Yup.string().required("Last Name is required"),
      })}
      onSubmit={handleSubmit}
    >
      {({
        values,
        errors,
        touched,
        handleChange,
        handleBlur,
        handleSubmit,
        isSubmitting,
      }) => (
        <div className="w-full max-w-xl bg-white border-t-[6px] border-[#0c3886] rounded-[2.5rem] shadow-xl overflow-hidden mt-2">
          <Form onSubmit={handleSubmit} className="flex flex-col gap-5 p-8 md:p-12">
            <div className="text-black text-center mb-4">
              <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="text-[#1449b2] font-semibold hover:underline">
                  Login
                </Link>
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                placeholder="e.g John Sam"
                className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors"
                value={values.firstName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.firstName && touched.firstName && (
                <div className="text-red-500 text-xs mt-1">
                  {errors.firstName}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                placeholder="e.g John Sam"
                className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors"
                value={values.lastName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errors.lastName && touched.lastName && (
                <div className="text-red-500 text-xs mt-1">
                  {errors.lastName}
                </div>
              )}
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
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-500 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder=""
                  className="w-full bg-white text-black border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1449b2] placeholder-gray-300 transition-colors pr-10"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && touched.confirmPassword && (
                <div className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword}
                </div>
              )}
            </div>

            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full bg-[#1449b2] hover:bg-[#0f3d99] text-white rounded-full py-4 text-base font-semibold shadow-md transition-colors mt-2"
            >
              Sign up
            </Button>

            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-gray-100"></div>
              <span className="px-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">Or</span>
              <div className="flex-1 border-t border-gray-100"></div>
            </div>

            <Button
              type="button"
              isLoading={isGoogleSigningUp}
              onClick={handleGoogleSignUp}
              className="w-full flex items-center justify-center gap-3 hover:bg-gray-50 bg-white text-gray-700 border border-gray-200 rounded-full py-3.5 font-semibold text-sm transition-colors shadow-sm"
            >
              <FaGoogle className="text-red-500 text-base" />
              Continue with Google
            </Button>
          </Form>

          <div className="bg-[#f3f4f6] px-8 py-6 flex justify-center border-t border-gray-100">
            <Link
              href="/"
              className="bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 font-semibold px-12 py-2.5 rounded-full text-sm transition-colors shadow-sm"
            >
              Back Home
            </Link>
          </div>
        </div>
      )}
    </Formik>
  );
};

export default SignupForm;
