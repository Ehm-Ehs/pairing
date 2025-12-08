import { Formik, Form } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../api/firebase";
import { doc, setDoc } from "firebase/firestore";
import Logo from "../../assets/logo";
import { Link, useNavigate } from "react-router-dom";
import Auth from "../api/auth.module";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { signInWithPopup } from "firebase/auth";
import { googleProvider } from "../api/firebase";
import { getDoc } from "firebase/firestore";
import { sendEmail } from "../api/email";
// getOnboardingEmail removed as we use template params now

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleGoogleSignUp = async () => {
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
          await sendEmail({
            to: user.email,
            subject: "Welcome to Pairing App! 🚀",
            templateParams: {
              user_name: user.displayName || "User",
              site_url: window.location.origin,
              action_url: `${window.location.origin}/home`, // Redirect to home or dashboard
              current_year: new Date().getFullYear(),
            },
          });
        }
      }

      const accessToken = await user.getIdToken();
      if (accessToken && user) {
        Auth.authenticateUser({ accessToken, data: user });
        toast.success("Sign up successful!", {
          position: "top-center",
          autoClose: 3000,
        });
        navigate("/home");
      }
    } catch (error: any) {
      console.error("Error signing up with Google:", error);
      toast.error(`Google Sign Up failed: ${error.message}`, {
        position: "top-center",
      });
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      console.log("User signed up:", user);
      const accessToken = await user.getIdToken();

      if (accessToken && user) {
        Auth.authenticateUser({ accessToken, data: user });

        // Include the userId in the Firestore document
        await setDoc(doc(db, "Users", user.uid), {
          userId, // Add the UUID here
          email: user.email,
          firstName: values.firstName,
          lastName: values.lastName,
        });

        // Send welcome email
        await sendEmail({
          to: values.email,
          subject: "Welcome to Pairing App! 🚀",
          templateParams: {
            user_name: values.firstName,
            site_url: window.location.origin,
            action_url: `${window.location.origin}/home`,
            current_year: new Date().getFullYear(),
          },
        });

        toast.success("Sign up successful!", {
          position: "top-center",
          autoClose: 3000,
        });

        navigate("/home");
      } else {
        toast.error("Failed to retrieve login details. Please try again.", {
          position: "top-center",
        });
      }
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast.error(error.message || "Sign up failed", {
        position: "top-center",
      });
    }
  };

  return (
    <div className="flex flex-col justify-center items-center px-4 w-full">
      <div className="flex items-center gap-2 py-5">
        <div className="w-10 h-10">
          <Logo />
        </div>
        <p className="pt-3 font-semibold">Pairing</p>
      </div>
      <div>
        <Formik
          initialValues={{
            email: "",
            password: "",
            confirmPassword: "",
            firstName: "",
            lastName: "",
          }}
          validationSchema={Yup.object({
            email: Yup.string()
              .email("Invalid email format")
              .required("Required"),
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
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  className="p-2 w-full bg-transparent border rounded"
                  value={values.firstName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.firstName && touched.firstName && (
                  <div className="text-red-500">{errors.firstName}</div>
                )}
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  className="p-2 w-full bg-transparent border rounded"
                  value={values.lastName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.lastName && touched.lastName && (
                  <div className="text-red-500">{errors.lastName}</div>
                )}
              </div>
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="p-2 w-full bg-transparent border rounded"
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.email && touched.email && (
                  <div className="text-red-500">{errors.email}</div>
                )}
              </div>
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Password"
                    className="p-2 w-full bg-transparent border rounded pr-10"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <div
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </div>
                </div>
                {errors.password && touched.password && (
                  <div className="text-red-500">{errors.password}</div>
                )}
              </div>
              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    className="p-2 w-full bg-transparent border rounded pr-10"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                  <div
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </div>
                </div>
                {errors.confirmPassword && touched.confirmPassword && (
                  <div className="text-red-500">{errors.confirmPassword}</div>
                )}
              </div>
              <button
                type="submit"
                className="bg-blue-700 text-white p-2 rounded hover:bg-blue-800"
              >
                Sign Up
              </button>
              <div className="flex items-center my-2">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-gray-500 text-sm">Or</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignUp}
                className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 p-2 rounded hover:bg-gray-50 transition-colors"
              >
                <FaGoogle className="text-red-500" />
                Sign up with Google
              </button>
              <p className="py-4 text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-700">
                  Login
                </Link>
              </p>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default Signup;
