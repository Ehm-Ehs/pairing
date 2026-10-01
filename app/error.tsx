"use client";

import { useEffect } from "react";
import Link from "next/link";
import Logo from "../src/assets/logo";
import { FaRotateLeft, FaHouse, FaFolderTree, FaWandMagicSparkles } from "react-icons/fa6";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error Boundary Caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#99bbff]/30 via-[#e6efff]/40 to-white text-slate-900 font-sans flex flex-col justify-between p-4 sm:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-4">
        <Link href="/" aria-label="PairForm Home">
          <Logo className="h-9 w-auto" />
        </Link>
        <Link
          href="/tools"
          className="text-xs font-bold text-[#1d4ed8] hover:underline"
        >
          Tools Hub →
        </Link>
      </header>

      {/* Main Error Box */}
      <main className="max-w-xl mx-auto w-full my-auto py-8 text-center">
        <div className="bg-white border border-blue-100 rounded-[2.5rem] p-8 sm:p-12 shadow-xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1d4ed8] mb-6 shadow-xs">
              <FaWandMagicSparkles size={28} />
            </div>

            <span className="px-3.5 py-1 rounded-full bg-blue-50 text-[#1d4ed8] text-[11px] font-bold uppercase tracking-wider mb-3">
              Application Error
            </span>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Something went wrong!
            </h1>

            <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-8 font-normal leading-relaxed">
              We encountered an unexpected glitch loading this page. Don't worry—your data and events remain completely safe.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => reset()}
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-[#205BE2] via-[#1A4ED8] to-[#0A389D] rounded-full hover:from-[#1b4ec2] hover:to-[#082f85] transition-all shadow-md flex items-center justify-center gap-2 active:scale-98"
              >
                <FaRotateLeft size={14} />
                <span>Try Again</span>
              </button>

              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <FaHouse size={14} className="text-slate-500" />
                <span>Back to Home</span>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 w-full text-center">
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#1d4ed8] hover:underline"
              >
                <FaFolderTree size={12} />
                <span>Explore Free Online Generators & Tools Hub</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center py-4 text-xs text-slate-400">
        © 2026 PairForm. Smart automated team formation.
      </footer>
    </div>
  );
}
