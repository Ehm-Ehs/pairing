"use client";

import React from "react";
import { LuLock, LuSparkles } from "react-icons/lu";
import { useRouter } from "next/navigation";

export default function GuestLimitBlocker() {
  const router = useRouter();

  return (
    <div className="relative max-w-lg w-full bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl rounded-[2.5rem] p-8 md:p-12 text-center overflow-hidden transition-all duration-300 hover:shadow-indigo-500/5 mt-8 md:mt-0">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-400/25 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lock Illustration wrapper */}
      <div className="relative mx-auto w-24 h-24 mb-8 flex items-center justify-center">
        {/* Pulsing glow circles */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 opacity-10 animate-ping" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 opacity-20 blur-sm" />
        
        {/* Core Lock Icon Box */}
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 transform hover:scale-110 transition-transform duration-300">
          <LuLock className="w-8 h-8 text-white" />
          <LuSparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
        </div>
      </div>

      {/* Headline & Badges */}
      <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold mb-6 shadow-sm">
        <span className="flex w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></span>
        Free Guest Plan Limit Reached
      </div>

      <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
        Unlock Unlimited Events
      </h3>

      {/* Copywriting description */}
      <p className="text-gray-600 text-[15px] leading-relaxed font-medium mb-8 max-w-md mx-auto">
        You&apos;ve successfully created <span className="font-bold text-gray-900 bg-blue-50 px-1.5 py-0.5 rounded">2 free guest events</span>! 
        Save your work and continue organizing flawless team pairings, Secret Santa games, and group formations with a permanent account.
      </p>

      {/* Call to Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
        <button
          onClick={() => router.push("/sign-up")}
          className="w-full sm:flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-full py-4 px-6 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-600/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Create Free Account
        </button>
        <button
          onClick={() => router.push("/login")}
          className="w-full sm:flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-full py-4 px-6 transition-all duration-300 border border-gray-200/50 transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Log in
        </button>
      </div>

      {/* Subtle reassurance */}
      <p className="text-xs text-gray-400 font-medium mt-6">
        No credit card required. Keep your existing events.
      </p>
    </div>
  );
}
