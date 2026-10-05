import React from "react";

const ROUND_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
export const DEFAULT_SPEED_NETWORKING_ROUNDS = 3;

interface Props {
  enabled?: boolean;
  rounds?: number;
  onChange: (next: { enabled: boolean; rounds: number }) => void;
  className?: string;
}

/** Event form option: turn on multi-round speed networking and pick the number of rounds. */
export const SpeedNetworkingOption: React.FC<Props> = ({ enabled = false, rounds, onChange, className = "" }) => {
  const currentRounds = rounds || DEFAULT_SPEED_NETWORKING_ROUNDS;

  return (
    <div className={`flex flex-col gap-3 p-4 rounded-2xl bg-white border border-gray-100/80 shadow-sm ${className}`}>
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          name="isSpeedNetworking"
          checked={enabled}
          onChange={(e) => onChange({ enabled: e.target.checked, rounds: currentRounds })}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <div>
          <span className="text-sm font-bold text-gray-900 flex flex-wrap items-center gap-2">
            <span>Enable Multi-Round Speed Networking</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold uppercase tracking-wider">
              0.5 Tokens / Participant
            </span>
          </span>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Generate continuous multi-round table rotations with zero repeat pairings (0.5 tokens per participant).
          </p>
        </div>
      </label>

      {enabled && (
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex flex-col">
            <label htmlFor="speedNetworkingRounds" className="text-xs font-bold text-gray-700">
              Number of Networking Rounds
            </label>
            <span className="text-[11px] text-gray-400">Select how many rounds to generate (1 to 10)</span>
          </div>
          <select
            id="speedNetworkingRounds"
            name="speedNetworkingRounds"
            value={currentRounds}
            onChange={(e) => onChange({ enabled, rounds: Number(e.target.value) })}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {ROUND_CHOICES.map((r) => (
              <option key={r} value={r}>
                {r} {r === 1 ? "Round" : "Rounds"}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
