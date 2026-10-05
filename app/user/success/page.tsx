"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { JoinSuccessCard, SummaryRow } from "@/components/join/JoinSuccessCard";
import { capitalizeWords } from "@/utils/stringUtils";

const SuccessContent = () => {
  const searchParams = useSearchParams();

  const groupName = capitalizeWords(searchParams.get("groupName") || "Your group");
  const role = capitalizeWords(searchParams.get("role") || "");
  const eventName = searchParams.get("eventName") || "Pairing Event";
  const email = searchParams.get("email") || "";

  const rows: SummaryRow[] = [{ label: "Event", value: capitalizeWords(eventName) }];
  if (role) rows.push({ label: "Your Role", value: role });
  rows.push({ label: "Assigned Group", value: groupName, highlight: true });
  rows.push({ label: "Status", value: role ? `${groupName} - ${role}` : groupName, highlight: true });

  return (
    <JoinSuccessCard
      rows={rows}
      message={
        <>
          A confirmation with your group details has been sent to{" "}
          {email ? <span className="font-bold text-gray-800">{email}</span> : "your email"}. Check your inbox (and
          spam, just in case).
        </>
      }
      badge={
        <>
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
        </>
      }
    />
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
