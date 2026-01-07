import React from "react";
import { FaCheckCircle, FaGift, FaUsers } from "react-icons/fa";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const JoinSuccess: React.FC = () => {
  const searchParams = useSearchParams();

  const isSecretSanta = searchParams.get("isSecretSanta") === "true";
  const isRandomPositioning =
    searchParams.get("isRandomPositioning") === "true";
  const nextStepsDate = searchParams.get("nextStepsDate");

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${
        isSecretSanta
          ? "from-red-50 to-green-50"
          : isRandomPositioning
          ? "from-purple-50 to-indigo-50"
          : "from-blue-50 to-indigo-50"
      } flex items-center justify-center p-4`}
    >
      <div
        className={`bg-white p-8 rounded-lg shadow-xl w-full max-w-md border-t-4 ${
          isSecretSanta
            ? "border-green-500"
            : isRandomPositioning
            ? "border-purple-500"
            : "border-blue-500"
        } text-center`}
      >
        <div
          className={`w-16 h-16 ${
            isSecretSanta
              ? "bg-green-100"
              : isRandomPositioning
              ? "bg-purple-100"
              : "bg-blue-100"
          } rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <FaCheckCircle
            className={`w-8 h-8 ${
              isSecretSanta
                ? "text-green-500"
                : isRandomPositioning
                ? "text-purple-500"
                : "text-blue-500"
            }`}
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">You're In!</h1>
        <p className="text-gray-600 mb-6">
          {isSecretSanta
            ? "You've successfully joined the Secret Santa. Watch your inbox (or check back) for updates!"
            : isRandomPositioning
            ? "You've successfully registered. Your position will be revealed soon!"
            : "You've successfully joined the pairing event. Watch your inbox (or check back) for updates!"}
        </p>

        <div
          className={`${
            isSecretSanta
              ? "bg-red-50"
              : isRandomPositioning
              ? "bg-purple-50"
              : "bg-blue-50"
          } p-4 rounded-lg mb-6`}
        >
          <div
            className={`flex items-center justify-center gap-2 ${
              isSecretSanta
                ? "text-red-600"
                : isRandomPositioning
                ? "text-purple-600"
                : "text-blue-600"
            } font-medium mb-1`}
          >
            {isSecretSanta ? (
              <FaGift />
            ) : isRandomPositioning ? (
              <FaUsers />
            ) : (
              <FaUsers />
            )}
            <span>What's Next?</span>
          </div>
          <p
            className={`text-sm ${
              isSecretSanta
                ? "text-red-500"
                : isRandomPositioning
                ? "text-purple-500"
                : "text-blue-500"
            }`}
          >
            {isSecretSanta
              ? "The organizer will draw names soon."
              : isRandomPositioning
              ? nextStepsDate
                ? `Positions reveal on ${new Date(
                    nextStepsDate
                  ).toLocaleString()}`
                : "The organizer will generate positions soon."
              : "The organizer will generate pairs soon."}
          </p>
        </div>

        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-900 underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default JoinSuccess;
