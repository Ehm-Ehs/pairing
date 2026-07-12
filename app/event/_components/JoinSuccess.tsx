"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";

const capitalizeWords = (str: string) => {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const JoinSuccess: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const isSecretSanta = searchParams.get("isSecretSanta") === "true";
  const isRandomPositioning = searchParams.get("isRandomPositioning") === "true";
  const nextStepsDate = searchParams.get("nextStepsDate");
  const eventName = searchParams.get("eventName") || (isSecretSanta ? "Secret Santa Event" : isRandomPositioning ? "Random Positioning Event" : "Just Pair Event");
  const email = searchParams.get("email") || "your email address";
  const pairIndex = searchParams.get("pairIndex");
  const positionLetter = searchParams.get("positionLetter");
  const assignedNumber = searchParams.get("assignedNumber");

  let statusText = "The organizer will generate pairs soon.";
  if (isSecretSanta) {
    statusText = "The organizer will draw names soon.";
  } else if (isRandomPositioning) {
    statusText = assignedNumber
      ? `Position #${assignedNumber}`
      : (nextStepsDate
        ? `Positions reveal on ${new Date(nextStepsDate).toLocaleString()}`
        : "The organizer will generate positions soon.");
  } else if (pairIndex && pairIndex !== "-1" && positionLetter) {
    statusText = `Pair ${Number(pairIndex) + 1} - Person ${positionLetter}`;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-805/85 bg-gray-800/80 p-4">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 flex flex-col items-center relative overflow-hidden text-black">
        {/* Close Button at top-right */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 right-6 w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-colors"
        >
          <span className="text-lg">×</span>
        </button>

        {/* Verified Seal Badge Container */}
        <div className="relative w-24 h-24 mb-6 mt-4 animate-bounce-subtle flex items-center justify-center bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-inner">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-center text-gray-900">
          You're in!
        </h1>
        <p className="text-sm text-gray-550 text-center max-w-md mb-8 leading-relaxed">
          {isSecretSanta
            ? "You've successfully joined the Secret Santa. Watch your inbox (or check back) for updates!"
            : isRandomPositioning
              ? (assignedNumber 
                  ? "You've successfully registered. Your assigned position details are shown below!"
                  : "You've successfully registered. Your position will be revealed soon!")
              : pairIndex && pairIndex !== "-1" && positionLetter
                ? "You've successfully reserved your slot. Your assignment details are shown below!"
                : "You've successfully joined the pairing event. Watch your inbox (or check back) for updates!"}
        </p>

        {/* Assignment panel */}
        <div className="w-full text-left mb-8 px-2">
          <h2 className="text-lg font-bold text-gray-800 mb-3 tracking-tight">
            Your Assignment
          </h2>
          <div className="w-full bg-[#f3f4f6] rounded-2xl p-5 border border-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm border-b border-gray-200/50 pb-3">
              <span className="text-gray-500 font-medium">Event</span>
              <span className="font-bold text-gray-900 capitalize">{capitalizeWords(eventName)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-200/50 pb-3">
              <span className="text-gray-500 font-medium">Your Role</span>
              <span className="font-bold text-gray-900">Participant</span>
            </div>
            {pairIndex && pairIndex !== "-1" && positionLetter && (
              <div className="flex justify-between items-center text-sm border-b border-gray-200/50 pb-3">
                <span className="text-gray-500 font-medium">Selected Slot</span>
                <span className="font-bold text-gray-900">
                  Pair {Number(pairIndex) + 1} - Person {positionLetter}
                </span>
              </div>
            )}
            {isRandomPositioning && assignedNumber && (
              <div className="flex justify-between items-center text-sm border-b border-gray-200/50 pb-3">
                <span className="text-gray-500 font-medium">Assigned Position</span>
                <span className="font-bold text-gray-900">
                  Position #{assignedNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-550 font-medium">Status</span>
              <span className="font-bold text-[#1449b2]">{statusText}</span>
            </div>
          </div>
        </div>

        {/* Go home button */}
        <button
          onClick={() => router.push("/")}
          className="bg-[#e5e7eb] hover:bg-gray-300 text-[#0c3886] font-bold px-12 py-3.5 rounded-full text-sm transition-all shadow-sm cursor-pointer"
        >
          Go home
        </button>
      </div>
    </div>
  );
};

export default JoinSuccess;
