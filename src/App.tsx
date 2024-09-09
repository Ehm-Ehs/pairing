import { Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./components/home";
import SigninPage from "./components/auth/signin";
import SignupPage from "./components/auth/signup";
import UserForm from "./components/user/userForm";
import { ToastContainer } from "react-toastify";
import Error from "./components/nav/error";
import { useState, useEffect } from "react";
import { fetchUserData } from "./components/api/endpoints";
import ProtectedRoute from "./components/routes/privateRoutes";
import Layout from "./components/nav/layout";
import Result from "./components/result";
import { GroupingsPageProps } from "./components/types";
import SharePage from "./components/share/share";
import Header from "./components/nav/header";

function App() {
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

  console.log({ user });
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Routes>
        <Route path="/form" element={<UserForm />} />
        <Route path="/share" element={<SharePage />} />

        <Route path="/login" element={<SigninPage />} />
        <Route path="/sign-up" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
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
