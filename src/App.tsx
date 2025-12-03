import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import Home from "./components/home/home";
import SigninPage from "./components/auth/signin";
import SignupPage from "./components/auth/signup";
import UserForm from "./components/user/userForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Error from "./components/nav/error";
import { useState, useEffect } from "react";
import { fetchUserData } from "./components/api/endpoints";
import ProtectedRoute from "./components/routes/privateRoutes";
import Layout from "./components/nav/layout";
import Result from "./components/result";
import { GroupingsPageProps } from "./components/types";
import CreateParing from "./components/home/createParing";

import SharePage from "./components/share/share";
import LandingPage from "./components/landing/LandingPage";
import { Loading } from "./components/common/loading";
import {
  FaRocket,
  FaHome,
  FaUserEdit,
  FaSignInAlt,
  FaUserPlus,
  FaMagic,
  FaSpinner,
  FaShareAlt,
} from "react-icons/fa";

function App() {
  const location = useLocation();
  console.log("Current Path:", location.pathname);
  const [user, setUser] = useState<GroupingsPageProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        await fetchUserData(setUser); // Pass setUser as setUserDetails
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null); // Set user to null in case of error
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const getLoadingContext = (pathname: string) => {
    switch (pathname) {
      case "/":
        return {
          message: "Preparing the landing page...",
          icon: <FaRocket className="w-12 h-12 animate-bounce" />,
        };
      case "/home":
        return {
          message: "Loading your dashboard...",
          icon: <FaHome className="w-12 h-12 animate-pulse" />,
        };
      case "/form":
        return {
          message: "Setting up the form...",
          icon: <FaUserEdit className="w-12 h-12 animate-pulse" />,
        };
      case "/create-event":
        return {
          message: "Preparing event creation...",
          icon: <FaUserEdit className="w-12 h-12 animate-pulse" />,
        };
      case "/login":
        return {
          message: "Redirecting to login...",
          icon: <FaSignInAlt className="w-12 h-12 animate-pulse" />,
        };
      case "/sign-up":
        return {
          message: "Preparing sign up...",
          icon: <FaUserPlus className="w-12 h-12 animate-pulse" />,
        };
      case "/your-pairing":
        return {
          message: "Generating your pairings...",
          icon: <FaMagic className="w-12 h-12 animate-spin" />,
        };
      case "/share":
        return {
          message: "Preparing share page...",
          icon: <FaShareAlt className="w-12 h-12 animate-pulse" />,
        };
      default:
        return {
          message: "Loading...",
          icon: <FaSpinner className="w-12 h-12 animate-spin" />,
        };
    }
  };

  console.log({ user });
  if (loading) {
    const { message, icon } = getLoadingContext(location.pathname);
    return <Loading message={message} icon={icon} />;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/form" element={<UserForm />} />
        <Route path="/share" element={<SharePage />} />

        <Route path="/login" element={<SigninPage />} />
        <Route path="/sign-up" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home data={user} />} />
            <Route path="/create-event" element={<CreateParing />} />
            <Route path="/your-pairing" element={<Result data={user} />} />
          </Route>
        </Route>
        <Route path="*" element={<Error />} />
      </Routes>
      <ToastContainer hideProgressBar />
    </>
  );
}

export default App;
