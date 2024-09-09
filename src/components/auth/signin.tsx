import React from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../api/firebase";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo";
import Auth from "../api/auth.module";
import { toast } from "react-toastify"; // Import toast

const SignIn = () => {
  const navigate = useNavigate();

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

      const accessToken = await user.getIdToken();

      if (accessToken && user) {
        Auth.authenticateUser({ accessToken, data: user });

        toast.success("Login successful!", {
          position: "top-center",
          autoClose: 3000,
        });

        navigate("/home");
        console.log("nav");
      } else {
        toast.error("Failed to retrieve login details. Please try again.", {
          position: "top-center",
        });
      }
    } catch (error: any) {
      console.error("Error logging in:", error.message);

      // Show error toast message
      toast.error(`Login failed: ${error.message}`, {
        position: "top-center",
      });
    }
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="flex items-center gap-2 py-5">
        <div className="w-10 h-10">
          <Logo />
        </div>
        <p className="pt-3 font-semibold">Pairing</p>
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
          <Form className="flex flex-col gap-4 bg-white pt-5 pb-10 px-10 mt-5 rounded shadow-xl">
            <div className="text-black text-2xl mb-6 text-center">
              <p className="text-2xl pb-2 font-medium">Login</p>
              <p className="text-sm">
                Add your details to get back into the app
              </p>
            </div>
            <div>
              <Field
                type="email"
                name="email"
                placeholder="Email"
                className="p-2 w-[350px] bg-transparent border rounded"
              />
              {errors.email && touched.email ? (
                <div className="text-red-500">{errors.email}</div>
              ) : null}
            </div>
            <div>
              <Field
                type="password"
                name="password"
                placeholder="Password"
                className="p-2 w-[350px] bg-transparent border rounded"
              />
              {errors.password && touched.password ? (
                <div className="text-red-500">{errors.password}</div>
              ) : null}
            </div>
            <button
              type="submit"
              className="bg-blue-700 text-white p-2 rounded hover:bg-blue-800"
            >
              Sign In
            </button>
            <p className="py-4 text-center">
              Don't have an account?
              <Link to="/sign-up" className="text-blue-700">
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
