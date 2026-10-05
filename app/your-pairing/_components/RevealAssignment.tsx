"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaGift, FaUsers, FaRandom } from "react-icons/fa";
import Logo from "@/assets/logo";
import { Loading } from "@/components/ui/loading";
import { Assignment, fetchReveal } from "@/services/endpoints";
import { capitalizeWords, formatGroupName } from "@/utils/stringUtils";

interface Props {
  eventId: string;
  token: string;
}

/**
 * A participant's private view of their own assignment, opened from the link that was
 * sent to them. The token in the link is what proves who they are.
 */
const RevealAssignment: React.FC<Props> = ({ eventId, token }) => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchReveal(eventId, token)
      .then((res) => {
        if (!cancelled) setAssignment(res.assignment);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "We could not load your assignment.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, token]);

  if (loading) return <Loading message="Loading your assignment..." />;

  const icon =
    assignment?.kind === "group" ? (
      <FaUsers className="w-6 h-6" />
    ) : assignment?.kind === "position" ? (
      <FaRandom className="w-5 h-5" />
    ) : (
      <FaGift className="w-6 h-6" />
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left">
      <Link href="/">
        <Logo className="h-9 w-auto mb-10" />
      </Link>

      <div className="bg-white rounded-[2rem] border-t-4 border-t-[#10B981] border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden">
        <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full">
          <div className="w-12 h-12 bg-[#10B981] text-white rounded-xl flex items-center justify-center shadow-md mb-4">
            {icon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center">
            {assignment ? capitalizeWords(assignment.eventTitle) : "Your Assignment"}
          </h1>
          {assignment?.name && (
            <span className="bg-[#D1FAE5] text-[#065F46] text-xs font-semibold px-4 py-1.5 rounded-full mt-1.5">
              For {assignment.name}
            </span>
          )}
        </div>

        <div className="p-6 md:p-8 w-full">
          {error || !assignment ? (
            <div className="text-center">
              <p className="text-base font-bold text-gray-900 mb-2">This link did not work</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                {error || "We could not load your assignment."} Ask the organizer to resend your private link.
              </p>
            </div>
          ) : assignment.kind === "secret-santa" ? (
            assignment.drawn && assignment.receiver ? (
              <div className="bg-[#E6F4EA] border border-emerald-100 rounded-3xl p-6 text-center">
                <p className="text-sm text-emerald-800 font-bold mb-2">You are the Secret Santa for:</p>
                <p className="text-3xl font-extrabold text-[#065F46] mb-4 font-heading tracking-tight capitalize">
                  {assignment.receiver.name}
                </p>
                {assignment.receiver.wishlist && (
                  <div className="bg-white p-4 rounded-2xl border border-emerald-100 mb-3">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Their Wishlist</p>
                    <p className="text-gray-700 italic text-sm">&ldquo;{assignment.receiver.wishlist}&rdquo;</p>
                  </div>
                )}
                {(assignment.budget || assignment.exchangeDate) && (
                  <p className="text-xs text-emerald-800 font-semibold">
                    {assignment.budget && <>Budget: {assignment.budget}</>}
                    {assignment.budget && assignment.exchangeDate && " • "}
                    {assignment.exchangeDate && <>Exchange date: {assignment.exchangeDate}</>}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-4">Keep it a secret. This page is only for you.</p>
              </div>
            ) : (
              <Pending text="Names have not been drawn yet. Come back to this link once the organizer runs the draw." />
            )
          ) : assignment.kind === "pair" ? (
            <Panel
              label="Your Selection"
              value={`Pair ${(assignment.pairIndex ?? -1) + 1} (Slot ${assignment.positionLetter})`}
              detail={assignment.partner ? `Paired with ${assignment.partner.name}` : "Awaiting pair"}
            />
          ) : assignment.kind === "position" ? (
            assignment.assignedNumber ? (
              <Panel label="Your Position" value={`#${assignment.assignedNumber}`} />
            ) : (
              <Pending text="Positions have not been generated yet. Come back to this link later." />
            )
          ) : (
            <div className="bg-[#E0EBFF] border border-blue-100 rounded-3xl p-6 text-center">
              <p className="text-xs text-blue-800 font-bold uppercase tracking-wider mb-2">Your Assignment</p>
              <p className="text-2xl font-extrabold text-[#012A7D] font-heading tracking-tight mb-1">
                {formatGroupName(assignment.groupKey)}
              </p>
              {assignment.role && (
                <p className="text-xs font-semibold text-gray-500 mb-4">
                  Role: <span className="text-gray-800 font-bold">{assignment.role}</span>
                </p>
              )}
              <ul className="text-left bg-white rounded-2xl border border-blue-100 divide-y divide-blue-50">
                {assignment.members.map((member, i) => (
                  <li key={i} className="px-4 py-2.5 text-sm flex justify-between gap-3">
                    <span className="font-semibold text-gray-800 capitalize">{member.name}</span>
                    {member.role && <span className="text-gray-500">{member.role}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Panel = ({ label, value, detail }: { label: string; value: string; detail?: string }) => (
  <div className="bg-[#E6F4EA] border border-emerald-100 rounded-3xl p-6 text-center">
    <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider mb-2">{label}</p>
    <p className="text-2xl font-extrabold text-gray-900 font-heading">{value}</p>
    {detail && <p className="text-xs text-emerald-800 font-semibold mt-3">{detail}</p>}
  </div>
);

const Pending = ({ text }: { text: string }) => (
  <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 text-center">
    <p className="text-sm font-bold text-amber-800 mb-1">Not ready yet</p>
    <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
  </div>
);

export default RevealAssignment;
