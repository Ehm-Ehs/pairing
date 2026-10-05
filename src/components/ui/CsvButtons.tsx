"use client";

import { errorMessage } from "@/utils/errors";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { importParticipants } from "@/services/participantImport";
import { parseParticipantsCsv } from "@/utils/csvImport";
import { logger } from "@/utils/logger";

const ArrowIcon = ({ direction }: { direction: "down" | "up" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    {direction === "down" ? <polyline points="7 10 12 15 17 10" /> : <polyline points="17 8 12 3 7 8" />}
    <line x1="12" y1={direction === "down" ? 15 : 3} x2="12" y2={direction === "down" ? 3 : 15} />
  </svg>
);

/** Lets an organizer add participants to an event from a CSV file. */
export const ImportCsvButton: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [busy, setBusy] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const parsed = await parseParticipantsCsv(file);
      if (parsed.length === 0) {
        toast.error("No valid participants found in CSV file.");
        return;
      }
      const added = await importParticipants(eventId, parsed);
      if (added > 0) toast.success(`Successfully imported ${added} participants from CSV!`);
      else toast.info("Nobody was added: the event is full or everyone is already registered.");
    } catch (err) {
      logger.error("CSV import error:", err);
      toast.error("Failed to import CSV: " + errorMessage(err));
    } finally {
      input.value = "";
      setBusy(false);
    }
  };

  return (
    <label
      className={`bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl px-4 py-2.5 shadow-sm hover:shadow transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0 select-none ${
        busy ? "opacity-50 cursor-wait" : "cursor-pointer"
      }`}
    >
      <span className="text-gray-500">
        <ArrowIcon direction="down" />
      </span>
      <span>{busy ? "Importing..." : "Import CSV"}</span>
      <input type="file" accept=".csv" onChange={handleFile} disabled={busy} className="hidden" />
    </label>
  );
};

/** Primary "Export" button used above participant tables. */
export const ExportCsvButton: React.FC<{ onClick: () => void; label?: string }> = ({ onClick, label = "Export" }) => (
  <button
    type="button"
    onClick={onClick}
    className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:opacity-95 text-white text-xs font-bold rounded-xl px-5 py-2.5 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer flex-shrink-0"
  >
    <ArrowIcon direction="up" />
    {label}
  </button>
);
