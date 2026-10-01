"use client";
import React, { useState } from "react";
import { FaSearch, FaTrashAlt, FaRandom } from "react-icons/fa";
import { RandomPositioningPairing } from "../../../src/types";
import { usePagination } from "../../../src/hooks/usePagination";
import { useBulkSelection } from "../../../src/hooks/useBulkSelection";
import { useRandomPositioningActions } from "../../../src/hooks/useRandomPositioningActions";
import { PaginationBar } from "../../../src/components/ui/PaginationBar";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { ParticipantTable } from "../../../src/components/ui/ParticipantTable";
import StatsCard from "./StatsCard";
import RandomPositionGrid from "./RandomPositionGrid";
import { auth } from "../../../src/services/firebase";
import { toast } from "react-toastify";

interface RandomPositioningResultProps {
  data: RandomPositioningPairing;
  isPublicView?: boolean;
}

const RandomPositioningResult: React.FC<RandomPositioningResultProps> = ({ data, isPublicView = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredParticipants = data.participants.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    currentPage,
    pageSize,
    setPageSize,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedParticipants,
    startEntryIndex,
    endEntryIndex,
    totalCount
  } = usePagination(filteredParticipants, 10);

  const { selectedIds, setSelectedIds, handleSelectRow, handleSelectAllToggle, isAllPageSelected } = useBulkSelection();

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const { loading, isDeleting, handleGenerate, handleRemove, handleBulkDelete } = useRandomPositioningActions(data, selectedIds, setSelectedIds);

  const totalPositions = data.expectedParticipants || 10;
  const totalParticipants = data.participants.length;

  const filledParticipants = data.participants.filter((p) => p.assignedNumber && p.assignedNumber > 0);
  const filledCount = filledParticipants.length;
  const capacityPct = totalPositions > 0 ? Math.round((filledCount / totalPositions) * 100) : 0;

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,Name,Email,Position\n";
      data.participants.forEach((p) => {
        const posText = p.assignedNumber ? `Position #${p.assignedNumber}` : "Available";
        csvContent += `"${p.name}","${p.email || ""}","${posText}"\n`;
      });
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `${data.title.replace(/\s+/g, "_")}_positions.csv`;
      link.click();
    } catch {
      // ignored
    }
  };

  const handleBulkImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser?.uid) return;

    try {
      const { parseParticipantsCsv } = await import("../../../src/utils/csvImport");
      const { addParticipantToRandomPositioning } = await import("../../../src/services/endpoints");
      const parsed = await parseParticipantsCsv(file);
      if (parsed.length === 0) {
        toast.error("No valid participants found in CSV file.");
        return;
      }

      let count = 0;
      for (const p of parsed) {
        if (p.name || p.email) {
          await addParticipantToRandomPositioning(
            auth.currentUser.uid,
            data.id,
            {
              name: p.name || (p.email ? p.email.split("@")[0] : "Participant"),
              email: p.email || "",
            }
          );
          count++;
        }
      }

      toast.success(`Successfully imported ${count} participants from CSV!`);
    } catch (err: any) {
      console.error("CSV import error:", err);
      toast.error("Failed to import CSV: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <StatsCard title="Registered" value={totalParticipants} description="participants joined" variant="blue" />
        <StatsCard title="Total Positions" value={totalPositions} description="Randomly assigned" variant="blue" />
        <StatsCard title="Filled" value={filledCount} description={`${capacityPct}% capacity`} variant="indigo" />
        <StatsCard title="Participants" value={totalParticipants} description="Checked in" variant="pink" />
      </div>

      <RandomPositionGrid filledParticipants={filledParticipants} />

      {!isPublicView && (
        <div className="flex flex-col gap-4 text-left border-t border-gray-100 pt-8">
          <h3 className="text-2xl font-bold text-gray-900 font-heading">All Participants</h3>
          <div className="bg-white rounded-[2rem] border border-gray-150/40 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-gray-900">Participants List</h4>
                <p className="text-xs text-gray-400">View and manage all participants</p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2 w-full sm:w-64 shadow-sm">
                  <FaSearch className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
                  <input type="text" placeholder="Search participant" value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="bg-transparent border-0 outline-none text-xs w-full placeholder-gray-400 text-gray-700 font-medium" />
                </div>
                {totalParticipants > 0 && (
                  <button onClick={handleGenerate} disabled={loading} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl px-5 py-2.5 shadow-sm hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50">
                    <FaRandom className="w-3 h-3 text-gray-500" /> Reassign all
                  </button>
                )}

                {/* Import CSV Button */}
                {data.status !== "locked" && (
                  <label className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl px-4 py-2.5 shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 select-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <span>Import CSV</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkImportCSV}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Export Button */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:opacity-95 text-white text-xs font-bold rounded-xl px-5 py-2.5 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer flex-shrink-0"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Export
                </button>
              </div>
            </div>

            {selectedIds.size > 0 && (
              <div className="bg-blue-50/50 border-b border-blue-100/50 px-6 py-3 flex items-center justify-between">
                <span className="text-xs font-bold text-blue-700">{selectedIds.size} participant(s) selected</span>
                <button disabled={isDeleting !== null} onClick={handleBulkDelete} className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 disabled:bg-red-400">
                  <FaTrashAlt className="w-3 h-3" /> Remove Selected
                </button>
              </div>
            )}

            {totalParticipants === 0 ? (
              <EmptyState message="No participants yet. Share the link to invite people!" />
            ) : filteredParticipants.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 font-semibold">No participants match &quot;{searchTerm}&quot;</div>
            ) : (
              <ParticipantTable
                headers={["Name", "Email", "Position", "Action"]}
                enableBulkSelection={true}
                isAllPageSelected={isAllPageSelected(paginatedParticipants)}
                onSelectAllToggle={() => handleSelectAllToggle(paginatedParticipants)}
                selectedIds={Array.from(selectedIds)}
                onSelectOneToggle={handleSelectRow}
                rows={paginatedParticipants.map((p) => ({
                  id: p.id,
                  cells: [
                    <span key="name" className="font-bold text-gray-900">{p.name}</span>,
                    <span key="email" className="text-gray-500">{p.email || "-"}</span>,
                    <span key="pos" className="font-bold text-blue-600">
                      {p.assignedNumber ? `Position #${p.assignedNumber}` : "Unassigned"}
                    </span>,
                    <button
                      key="action"
                      disabled={isDeleting === p.id}
                      onClick={() => handleRemove(p.id, p.name)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isDeleting === p.id ? "Removing..." : "Remove"}
                    </button>,
                  ],
                }))}
              />
            )}

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              startEntryIndex={startEntryIndex}
              endEntryIndex={endEntryIndex}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RandomPositioningResult;
