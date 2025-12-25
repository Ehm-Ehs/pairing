import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../api/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../../assets/logo";
import Auth from "../api/auth.module";
import { toast } from "react-toastify"; // Import toast
import { FaGoogle } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "../api/email";

const SignIn = () => {
  const navigate = useNavigate();

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
          await sendEmail({
            to: user.email,
            subject: "Welcome to Pairing App! 🚀",
            html: `
              <h1>Welcome ${user.displayName || "User"}!</h1>
              <p>We're excited to have you on board.</p>
              <p>Start creating your pairings now!</p>
            `,
          });
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
        navigate("/home");
      }
    } catch (error: any) {
      console.error("Error logging in with Google:", error);
      toast.error(`Google Login failed: ${error.message}`, {
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
    <div className="flex flex-col justify-center items-center px-4 w-full">
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
          <Form className="flex flex-col gap-4 bg-white p-6 md:p-10 mt-5 rounded shadow-xl w-full max-w-md">
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
                className="p-2 w-full bg-transparent border rounded"
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
                className="p-2 w-full bg-transparent border rounded"
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

            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-gray-500 text-sm">Or</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 p-2 rounded hover:bg-gray-50 transition-colors"
            >
              <FaGoogle className="text-red-500" />
              Sign in with Google
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
