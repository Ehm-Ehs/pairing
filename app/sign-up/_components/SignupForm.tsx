"use client";
import Link from "next/link";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { useSignup } from "../../../src/hooks/useSignup";
import { Button } from "../../../src/components/ui/button";

const SignupForm = () => {
  const {
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleGoogleSignUp,
    handleSubmit,
  } = useSignup();

  return (
    <Formik
      initialValues={{
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
      }}
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
        <Form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-white p-6 md:p-10 mt-5 rounded shadow-xl w-full max-w-md"
        >
          {" "}
          <div className="text-black text-2xl mb-6 text-center">
            <p className="text-2xl pb-2 font-medium">Create an Account</p>
            <p className="text-sm">
              Lets get you started with creating your pairings
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              className="p-2 w-full bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={values.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.firstName && touched.firstName && (
              <div className="text-red-500 text-sm mt-1">
                {errors.firstName}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="p-2 w-full bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={values.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.lastName && touched.lastName && (
              <div className="text-red-500 text-sm mt-1">{errors.lastName}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="p-2 w-full bg-white text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
            />
            {errors.email && touched.email && (
              <div className="text-red-500 text-sm mt-1">{errors.email}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                className="p-2 w-full bg-white text-black border border-gray-300 rounded pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <div
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
            {errors.password && touched.password && (
              <div className="text-red-500 text-sm mt-1">{errors.password}</div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                className="p-2 w-full bg-white text-black border border-gray-300 rounded pr-10 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <div
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <div className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </div>
            )}
          </div>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="bg-blue-700 hover:bg-blue-800 w-full"
          >
            Sign Up
          </Button>
          <div className="flex items-center my-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">Or</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>
          <Button
            type="button"
            onClick={handleGoogleSignUp}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 hover:bg-gray-50 bg-white"
          >
            <FaGoogle className="text-red-500" />
            Sign up with Google
          </Button>
          <p className="py-4 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-700">
              Login
            </Link>
          </p>
        </Form>
      )}
    </Formik>
  );
};

export default SignupForm;
