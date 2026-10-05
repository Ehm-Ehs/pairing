"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PrivateLinkCard } from "@/components/events/PrivateLinkCard";

export interface SummaryRow {
  label: string;
  value: React.ReactNode;
  /** Shown in the brand colour. */
  highlight?: boolean;
}

interface Props {
  /** The celebratory graphic at the top of the card. */
  badge: React.ReactNode;
  message: React.ReactNode;
  rows: SummaryRow[];
}

/** The "You're in!" confirmation shown after a participant joins any kind of event. */
export const JoinSuccessCard: React.FC<Props> = ({ badge, message, rows }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800/80 p-4">
      <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 flex flex-col items-center relative overflow-hidden text-black">
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Close"
          className="absolute top-6 right-6 w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-200 transition-colors"
        >
          <span className="text-lg">×</span>
        </button>

        {badge}

        <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-center text-gray-900">You&apos;re in!</h1>
        <p className="text-sm text-gray-500 text-center max-w-md mb-8 leading-relaxed">{message}</p>

        <PrivateLinkCard />

        <div className="w-full text-left mb-8 px-2">
          <h2 className="text-lg font-bold text-gray-800 mb-3 tracking-tight">Your Assignment</h2>
          <div className="w-full bg-[#f3f4f6] rounded-2xl p-5 border border-gray-100 flex flex-col gap-4">
            {rows.map((row, i) => (
              <div
                key={row.label}
                className={`flex justify-between items-center text-sm ${
                  i < rows.length - 1 ? "border-b border-gray-200/50 pb-3" : ""
                }`}
              >
                <span className="text-gray-500 font-medium">{row.label}</span>
                <span className={`font-bold capitalize ${row.highlight ? "text-[#1449b2]" : "text-gray-900"}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="bg-[#e5e7eb] hover:bg-gray-300 text-[#0c3886] font-bold px-12 py-3.5 rounded-full text-sm transition-all shadow-sm cursor-pointer"
        >
          Go home
        </button>
      </div>
    </div>
  );
};
