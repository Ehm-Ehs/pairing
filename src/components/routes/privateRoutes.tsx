import { Navigate, Outlet, useLocation } from "react-router-dom";
import Auth from "../../services/auth.module";

const ProtectedRoute = () => {
  const location = useLocation();

  const isAuthenticated = Auth.isUserAuthenticated(); // Check if the user is authenticated
  const user = isAuthenticated
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : null;
  console.log("ProtectedRoute check:", { isAuthenticated, user });
  if (!isAuthenticated || !user) {
    console.log("Redirecting to login...");
    return <Navigate to="/login" state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
