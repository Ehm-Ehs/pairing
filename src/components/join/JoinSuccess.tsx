import React from "react";
import { FaCheckCircle, FaGift } from "react-icons/fa";
import { Link } from "react-router-dom";

const JoinSuccess: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 border-green-500 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaCheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h1>
        <p className="text-gray-600 mb-6">
          You've successfully joined the Secret Santa. Watch your inbox (or
          check back) for updates!
        </p>

        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-center gap-2 text-red-600 font-medium mb-1">
            <FaGift />
            <span>What's Next?</span>
          </div>
          <p className="text-sm text-red-500">
            The organizer will draw names soon.
          </p>
        </div>

        <Link
          to="/"
          className="text-sm text-gray-500 hover:text-gray-900 underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default JoinSuccess;
