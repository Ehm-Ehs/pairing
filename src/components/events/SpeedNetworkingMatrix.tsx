"use client";

import React, { useState, useMemo } from "react";
import {
  generateMultiRoundMatrix,
  exportZoomBreakoutCsv,
  exportTeamsBreakoutCsv,
  ParticipantItem,
  SpeedNetworkingMatrixResult,
} from "../../utils/speedNetworking";
import { FaDownload, FaUsers, FaArrowRight, FaHashtag, FaPaperPlane } from "react-icons/fa6";
import { FaSearch } from "react-icons/fa";
import { toast } from "react-toastify";

interface SpeedNetworkingMatrixProps {
  participants: ParticipantItem[];
  eventName?: string;
  initialRounds?: number;
  eventId?: string;
  userId?: string;
}

export default function SpeedNetworkingMatrix({
  participants,
  eventName = "Speed Networking Event",
  initialRounds = 3,
  eventId,
  userId,
}: SpeedNetworkingMatrixProps) {
  const [tableSize, setTableSize] = useState<number>(2);
  const [activeRoundTab, setActiveRoundTab] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [notifying, setNotifying] = useState<boolean>(false);

  const numberOfRounds = initialRounds || 3;

  const matrix: SpeedNetworkingMatrixResult = useMemo(() => {
    return generateMultiRoundMatrix(participants, numberOfRounds, tableSize);
  }, [participants, numberOfRounds, tableSize]);

  const currentRound = useMemo(() => {
    return matrix.rounds.find((r) => r.roundNumber === activeRoundTab) || matrix.rounds[0];
  }, [matrix, activeRoundTab]);

  const filteredPairs = useMemo(() => {
    if (!currentRound) return [];
    if (!searchQuery.trim()) return currentRound.pairs;

    const q = searchQuery.toLowerCase();
    return currentRound.pairs.filter((pair) => {
      const parts = pair.participants || [pair.participantA, pair.participantB];
      return parts.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.email && p.email.toLowerCase().includes(q))
      );
    });
  }, [currentRound, searchQuery]);

  if (!participants || participants.length < 2) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl">
        <FaUsers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-slate-700">Multi-Round Networking Matrix</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Add at least 2 participants to automatically generate zero-repeat multi-round schedules.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0B51D8] text-xs font-bold uppercase tracking-wider mb-2">
            <FaUsers className="w-3.5 h-3.5" />
            <span>Zero-Duplicate Pairing Matrix</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            Multi-Round Speed Networking Schedule
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {participants.length} attendees &bull; Guaranteed unique partner per round
          </p>
        </div>

        {/* Table Size Selector & CSV Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700">
            <span>Participants per Table:</span>
            <select
              value={tableSize}
              onChange={(e) => {
                setTableSize(Number(e.target.value));
              }}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0B51D8]"
            >
              {[2, 3, 4, 5, 6, 8, 10].map((size) => (
                <option key={size} value={size}>
                  {size} Participants
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => exportZoomBreakoutCsv(matrix, eventName)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0B51D8] text-xs font-bold transition-all border border-blue-200 cursor-pointer"
          >
            <FaDownload className="w-3 h-3" />
            <span>Export Zoom CSV</span>
          </button>

          <button
            type="button"
            onClick={() => exportTeamsBreakoutCsv(matrix, eventName)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0B51D8] hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <FaDownload className="w-3 h-3" />
            <span>Export Matrix CSV</span>
          </button>
        </div>
      </div>

      {/* Round Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
        {matrix.rounds.map((round) => {
          const isActive = round.roundNumber === activeRoundTab;
          return (
            <button
              key={round.roundNumber}
              type="button"
              onClick={() => setActiveRoundTab(round.roundNumber)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "bg-[#0B51D8] text-white shadow-xs"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              }`}
            >
              <span>Round {round.roundNumber}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {round.pairs.length} tables
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-md">
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter table assignments by attendee name or email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0B51D8] focus:ring-1 focus:ring-[#0B51D8] transition-all bg-slate-50/50"
        />
      </div>

      {/* Round Schedule Pairs Grid */}
      {currentRound && (
        <div className="space-y-4">
          {currentRound.byeParticipant && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between">
              <span>
                <strong>Solo / Floating Facilitator this Round:</strong> {currentRound.byeParticipant.name}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold uppercase">
                Floating
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPairs.map((pair) => (
              <div
                key={pair.tableNumber}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-[#0B51D8] hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-[#0B51D8] text-[11px] font-bold">
                    <FaHashtag className="w-2.5 h-2.5" />
                    Table {pair.tableNumber}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    5 Min Session
                  </span>
                </div>

                <div className="space-y-2">
                  {(pair.participants || [pair.participantA, pair.participantB]).map((p, pIdx, arr) => (
                    <React.Fragment key={p.id || p.name + pIdx}>
                      <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                        <p className="text-xs font-bold text-slate-900">{p.name}</p>
                        {p.email && (
                          <p className="text-[11px] text-slate-400 truncate">{p.email}</p>
                        )}
                      </div>
                      {pIdx < arr.length - 1 && (
                        <div className="flex justify-center text-slate-400 py-0.5">
                          <FaArrowRight className="w-3.5 h-3.5 rotate-90" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredPairs.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs font-medium">
              No matching attendee found for &ldquo;{searchQuery}&rdquo; in Round {currentRound.roundNumber}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
