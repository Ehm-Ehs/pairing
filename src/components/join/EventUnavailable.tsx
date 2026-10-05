"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { JoinCard, NEUTRAL_BUTTON } from "./JoinCard";

const COPY = {
  closed: {
    accent: "red" as const,
    symbol: "×",
    badge: "Closed",
    fallback: "Sorry, this event is closed. No further registrations are allowed.",
  },
  full: {
    accent: "amber" as const,
    symbol: "!",
    badge: "Event Full",
    fallback: "Sorry, this event is full. All available slots have been taken.",
  },
};

interface Props {
  reason: "closed" | "full";
  title: string;
  /** The organizer's own message for this state, if they set one. */
  message?: string;
  /** Opens the "already registered?" lookup. */
  onReveal: () => void;
}

/** Tells a visitor that registration is closed or full, and lets existing participants look themselves up. */
export const EventUnavailable: React.FC<Props> = ({ reason, title, message, onReveal }) => {
  const router = useRouter();
  const copy = COPY[reason];

  return (
    <JoinCard
      accent={copy.accent}
      icon={<span className="text-xl font-bold">{copy.symbol}</span>}
      title={title}
      badge={copy.badge}
    >
      <div className="p-8 md:p-10 flex flex-col items-center text-center gap-6 w-full font-medium text-gray-700">
        <p className="text-sm text-gray-500 leading-relaxed max-w-md">{message || copy.fallback}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <button
            type="button"
            onClick={onReveal}
            className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:opacity-95 text-white font-bold px-4 sm:px-8 py-3.5 rounded-full text-xs transition-all shadow-md cursor-pointer text-center"
          >
            Already registered? Reveal assignment
          </button>
          <button type="button" onClick={() => router.push("/")} className={NEUTRAL_BUTTON}>
            Go home
          </button>
        </div>
      </div>
    </JoinCard>
  );
};
