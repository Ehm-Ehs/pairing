import React, { useEffect } from "react";
import { FaCheckCircle, FaUsers } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../../components/layout/header";

const UserJoinSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    groupName?: string;
    role?: string;
    eventName?: string;
  } | null;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/");
    }, 600000); // 10 minutes

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center border-t-4 border-blue-500">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="w-8 h-8 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You're Signed Up!
            </h1>

            {state?.eventName && (
              <p className="text-gray-500 mb-6">
                for{" "}
                <span className="font-semibold text-gray-700">
                  {state.eventName}
                </span>
              </p>
            )}

            <div className="bg-blue-50/50 rounded-xl p-6 mb-8 border border-blue-100">
              {state?.groupName ? (
                <>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                    You have been assigned to
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <FaUsers className="text-blue-500 text-xl" />
                    <span className="text-3xl font-bold text-gray-900">
                      {state.groupName}
                    </span>
                  </div>
                  {state?.role && (
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                      {state.role}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-gray-600">
                  You have successfully joined the event.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                Check your email for confirmation details.
              </p>
              <Link
                to="/"
                className="block w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserJoinSuccess;
