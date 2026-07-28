import React from "react";
import { RandomParticipant } from "../../../src/types";

interface RandomPositionGridProps {
  filledParticipants: RandomParticipant[];
}

const getAvatarColor = (name: string, index: number) => {
  const gradients = [
    "from-pink-500 to-rose-500",
    "from-purple-500 to-indigo-500",
    "from-blue-500 to-cyan-500",
    "from-teal-500 to-emerald-500",
    "from-yellow-500 to-orange-500",
    "from-fuchsia-500 to-pink-500",
  ];
  const gradient = gradients[index % gradients.length];
  const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
  return (
    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold font-mono shadow-sm flex-shrink-0`}>
      {initial}
    </div>
  );
};

const RandomPositionGrid: React.FC<RandomPositionGridProps> = ({ filledParticipants }) => {
  return (
    <div className="text-left">
      <h3 className="text-2xl font-bold text-gray-900 mb-6 font-heading">
        Participants
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {filledParticipants
          .sort((a, b) => (a.assignedNumber || 0) - (b.assignedNumber || 0))
          .map((participant, idx) => {
            const positionNumber = participant.assignedNumber;
            return (
              <div
                key={participant.id}
                className="bg-white rounded-3xl border border-gray-150/45 p-5 shadow-sm flex items-center justify-between gap-4 transition-all hover:shadow duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getAvatarColor(participant.name, idx)}
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-gray-400 tracking-wider">
                      Position #{positionNumber}
                    </p>
                    <h5 className="text-sm font-bold text-gray-900 mt-0.5 truncate capitalize font-heading">
                      {participant.name}
                    </h5>
                    {participant.email && (
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">
                        {participant.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Circle check status icon */}
                <div className="w-5 h-5 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 flex-shrink-0">
                  ✓
                </div>
              </div>
            );
          })}
        {filledParticipants.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-450 font-semibold border-2 border-dashed border-gray-200 rounded-3xl bg-white/40">
            No positions assigned yet. Shuffling will assign positions to checked-in participants.
          </div>
        )}
      </div>
    </div>
  );
};

export default RandomPositionGrid;
