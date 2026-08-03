import React from "react";
import { FaTimes, FaLock } from "react-icons/fa";
import { RoleBasedPairing, Participant } from "../../../src/types";
import { getGravatarUrl } from "../../../src/utils/avatar";
import { capitalizeWords, formatGroupName } from "../../../src/utils/stringUtils";

interface RoleGridProps {
  pairing: RoleBasedPairing;
  isDeleting: string | null;
  handleClearSlot: (groupKey: string, participant: Participant) => void;
  isPublicView?: boolean;
  unblurredGroupKey?: string | null;
}

export const getRoleBadgeStyle = (role: string) => {
  const normalized = (role || "").toLowerCase().trim();
  if (normalized.includes("developer") || normalized.includes("engineer") || normalized.includes("dev") || normalized.includes("tech")) {
    return "bg-blue-50 text-blue-600 border border-blue-100";
  }
  if (normalized.includes("designer") || normalized.includes("ui") || normalized.includes("ux") || normalized.includes("art")) {
    return "bg-purple-50 text-purple-600 border border-purple-100";
  }
  if (normalized.includes("manager") || normalized.includes("pm") || normalized.includes("product") || normalized.includes("lead")) {
    return "bg-amber-50 text-amber-600 border border-amber-100";
  }
  if (normalized.includes("marketing") || normalized.includes("sale") || normalized.includes("growth") || normalized.includes("pr")) {
    return "bg-pink-50 text-pink-600 border border-pink-100";
  }
  if (normalized.includes("writer") || normalized.includes("content") || normalized.includes("editor")) {
    return "bg-emerald-50 text-emerald-600 border border-emerald-100";
  }
  if (normalized.includes("researcher") || normalized.includes("analyst") || normalized.includes("data")) {
    return "bg-teal-50 text-teal-600 border border-teal-100";
  }
  return "bg-gray-50 text-gray-600 border border-gray-150";
};

const RoleGrid: React.FC<RoleGridProps> = ({
  pairing,
  isDeleting,
  handleClearSlot,
  isPublicView = false,
  unblurredGroupKey = null,
}) => {
  const isRestricted = isPublicView && pairing.visibilityMode === "restricted";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(pairing.groups || {}).map(([groupKey, group]: [string, Participant[]], groupIndex) => {
        const totalGroupSlots = group.length;
        const filledGroupSlots = group.filter((p) => p.name).length;
        const isCurrentGroupUnblurred = !isRestricted || unblurredGroupKey === groupKey;

        return (
          <div
            key={groupKey}
            className={`bg-white rounded-[1.5rem] border p-5 shadow-sm transition-all duration-300 flex flex-col gap-4 relative ${
              isCurrentGroupUnblurred
                ? "border-blue-200 shadow-md ring-2 ring-blue-500/10"
                : "border-gray-150/40 opacity-95"
            }`}
          >
            {/* Card Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-gray-900 font-heading">
                  {formatGroupName(groupKey, groupIndex)}
                </h4>
                {isRestricted && !isCurrentGroupUnblurred && (
                  <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                    <FaLock className="w-2.5 h-2.5" /> Restricted
                  </span>
                )}
                {isRestricted && isCurrentGroupUnblurred && unblurredGroupKey && (
                  <span className="bg-green-50 text-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-green-200">
                    Your Group
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-400">
                {filledGroupSlots}/{totalGroupSlots} members
              </span>
            </div>

            {/* Slots List */}
            <div className="flex flex-col gap-2.5">
              {group.map((participant, i) => {
                const isSlotFilled = !!(participant.name && participant.name.trim() !== "");

                // UNFILLED / EMPTY SLOTS ARE ALWAYS UNBLURRED
                if (!isSlotFilled) {
                  return (
                    <div
                      key={i}
                      className="border border-dashed border-blue-200 bg-blue-50/20 rounded-2xl p-3 flex items-center gap-3 w-full"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100/60 border border-blue-200 flex-shrink-0 flex items-center justify-center text-blue-600 text-xs font-bold font-mono">
                        #{participant.number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-blue-900 capitalize flex items-center gap-1">
                          Available Slot
                        </p>
                        <p className="text-[10px] text-blue-700 font-medium capitalize">
                          {capitalizeWords(participant.role) || "Waiting for participant"}
                        </p>
                      </div>
                    </div>
                  );
                }

                // RESTRICTED BLURRED FILLED SLOT
                if (isRestricted && !isCurrentGroupUnblurred) {
                  return (
                    <div
                      key={i}
                      className="border border-gray-100 bg-gray-50/50 rounded-2xl p-3 flex items-center gap-3 w-full relative overflow-hidden select-none"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 blur-[3px]" />
                      <div className="flex-grow min-w-0">
                        {participant.role && participant.role.trim() !== "" && (
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${getRoleBadgeStyle(participant.role)}`}>
                            {capitalizeWords(participant.role)}
                          </span>
                        )}
                        <h5 className="text-xs font-bold text-gray-400 mt-1 blur-[4px]">
                          ••••••••••••
                        </h5>
                        <p className="text-[10px] text-gray-300 mt-0.5 blur-[3px]">
                          ••••••@••••.com
                        </p>
                      </div>
                    </div>
                  );
                }

                // UNBLURRED NORMAL FILLED SLOT
                return (
                  <div
                    key={i}
                    className="border border-gray-150/40 bg-white rounded-2xl p-3 flex items-center gap-3 w-full shadow-sm"
                  >
                    <img
                      src={getGravatarUrl(participant.email, participant.name)}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                    />
                    <div className="flex-grow min-w-0">
                      {participant.role && participant.role.trim() !== "" && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${getRoleBadgeStyle(participant.role)}`}>
                          {capitalizeWords(participant.role)}
                        </span>
                      )}
                      <h5 className="text-xs font-bold text-gray-900 mt-1 truncate capitalize font-heading">
                        {participant.name}
                      </h5>
                      {participant.email && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">
                          {participant.email}
                        </p>
                      )}
                    </div>

                    {/* Remove Slot trigger */}
                    {!isPublicView && pairing.status !== "locked" && (
                      <button
                        type="button"
                        disabled={isDeleting !== null}
                        onClick={() => handleClearSlot(groupKey, participant)}
                        className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full cursor-pointer transition-colors self-center flex-shrink-0 disabled:opacity-50"
                        title="Clear slot"
                      >
                        <FaTimes className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RoleGrid;
