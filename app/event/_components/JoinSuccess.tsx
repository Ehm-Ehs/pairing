"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { capitalizeWords } from "@/utils/stringUtils";
import { JoinSuccessCard, SummaryRow } from "@/components/join/JoinSuccessCard";

const JoinSuccess: React.FC = () => {
  const searchParams = useSearchParams();

  const isSecretSanta = searchParams.get("isSecretSanta") === "true";
  const isRandomPositioning = searchParams.get("isRandomPositioning") === "true";
  const nextStepsDate = searchParams.get("nextStepsDate");
  const eventName = searchParams.get("eventName") || (isSecretSanta ? "Secret Santa Event" : isRandomPositioning ? "Random Positioning Event" : "Just Pair Event");
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

  const hasSlot = !!pairIndex && pairIndex !== "-1" && !!positionLetter;
  const message = isSecretSanta
    ? "You've successfully joined the Secret Santa. Watch your inbox (or check back) for updates!"
    : isRandomPositioning
      ? assignedNumber
        ? "You've successfully registered. Your assigned position details are shown below!"
        : "You've successfully registered. Your position will be revealed soon!"
      : hasSlot
        ? "You've successfully reserved your slot. Your assignment details are shown below!"
        : "You've successfully joined the pairing event. Watch your inbox (or check back) for updates!";

  const rows: SummaryRow[] = [{ label: "Event", value: capitalizeWords(eventName) }];
  if (!isRandomPositioning && !isSecretSanta) rows.push({ label: "Your Role", value: "Participant" });
  if (hasSlot) rows.push({ label: "Selected Slot", value: `Pair ${Number(pairIndex) + 1} - Person ${positionLetter}` });
  if (isRandomPositioning && assignedNumber) rows.push({ label: "Assigned Position", value: `Position #${assignedNumber}` });
  rows.push({ label: "Status", value: statusText, highlight: true });

  return (
    <JoinSuccessCard
      message={message}
      rows={rows}
      badge={
        <div className="relative w-24 h-24 mb-6 mt-4 animate-bounce-subtle flex items-center justify-center bg-blue-50 text-blue-600 rounded-full border border-blue-100 shadow-inner">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      }
    />
  );
};

export default JoinSuccess;
