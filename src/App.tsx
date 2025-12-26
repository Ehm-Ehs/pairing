import { Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/home";
import SigninPage from "./pages/auth/signin";
import SignupPage from "./pages/auth/signup";
import UserForm from "./pages/user/userForm";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Error from "./components/layout/error";

import ProtectedRoute from "./components/routes/privateRoutes";
import Layout from "./components/layout/layout";
import { useAuthListener } from "./hooks/useAuthListener";
import Result from "./pages/result/Result";

import CreateParing from "./pages/home/createParing";

import SharePage from "./pages/share/share";
import JoinSecretSanta from "./pages/join/JoinSecretSanta";
import JoinSuccess from "./pages/join/JoinSuccess";
import LandingPage from "./pages/landing/LandingPage";
import UserJoinSuccess from "./pages/user/UserJoinSuccess";
import { Loading } from "./components/ui/loading";
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
  const { user, loading } = useAuthListener();

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
        <Route path="/user/success" element={<UserJoinSuccess />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/event/:userId/:eventId" element={<JoinSecretSanta />} />
        <Route path="/event/success" element={<JoinSuccess />} />

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
