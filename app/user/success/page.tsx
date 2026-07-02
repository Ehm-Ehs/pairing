"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

const SuccessContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const groupName = searchParams.get("groupName") || "Group 7";
  const role = searchParams.get("role") || "Developer";
  const eventName = searchParams.get("eventName") || "Startup Weekend Hackathon";
  const email = searchParams.get("email") || "sarah@example.com";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800/80 p-4">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 flex flex-col items-center relative overflow-hidden text-black">
        {/* Close Button at top-right */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 right-6 w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-colors"
        >
          <span className="text-lg">×</span>
        </button>

        {/* Confetti & Verified Seal Badge Container */}
        <div className="relative w-full flex justify-center mb-6 mt-4">
          {/* Confetti SVGs/Graphics background */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" className="w-48 h-48 opacity-80">
              {/* Confetti streamers & dots */}
              <path d="M40 50 Q 50 25 70 45" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M150 45 Q 165 60 145 75" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M35 140 Q 55 155 45 170" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none" />
              <circle cx="90" cy="30" r="4" fill="#10B981" />
              <circle cx="160" cy="130" r="5" fill="#EC4899" />
              <circle cx="50" cy="100" r="3" fill="#6366F1" />
              <polygon points="120,25 125,35 115,32" fill="#FBBF24" />
              <polygon points="175,80 182,85 178,92" fill="#10B981" />
            </svg>
          </div>

          {/* Scalloped Verified Seal Badge */}
          <div className="relative z-10 w-28 h-28 text-[#1449b2] drop-shadow-xl animate-bounce-subtle">
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-full h-full">
              <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01-.622-.636zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708z"/>
            </svg>
          </div>
        </div>

        {/* You're in! text */}
        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-center text-gray-900">
          You're in!
        </h1>
        <p className="text-sm text-gray-500 text-center max-w-md mb-8 leading-relaxed">
          A confirmation with your group details has been sent to <span className="font-bold text-gray-800">{email}</span>. Check your inbox (and spam, just in case).
        </p>

        {/* Assignment panel */}
        <div className="w-full text-left mb-8 px-2">
          <h2 className="text-lg font-bold text-gray-800 mb-3 tracking-tight">
            Your Assignment
          </h2>
          <div className="w-full bg-[#f3f4f6] rounded-2xl p-5 border border-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm border-b border-gray-200/50 pb-3">
              <span className="text-gray-500 font-medium">Event</span>
              <span className="font-bold text-gray-900">{eventName}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-gray-200/50 pb-3">
              <span className="text-gray-500 font-medium">Your Role</span>
              <span className="font-bold text-gray-900">{role}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Assigned Group</span>
              <span className="font-bold text-[#1449b2]">{groupName}</span>
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

export default function UserSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm font-semibold">
        Loading...
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
