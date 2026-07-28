"use client";
import React, { useState } from "react";
import { FaSearch, FaFileDownload, FaTrashAlt, FaRandom } from "react-icons/fa";
import { RandomPositioningPairing } from "../../../src/types";
import { usePagination } from "../../../src/hooks/usePagination";
import { useBulkSelection } from "../../../src/hooks/useBulkSelection";
import { useRandomPositioningActions } from "../../../src/hooks/useRandomPositioningActions";
import { PaginationBar } from "../../../src/components/ui/PaginationBar";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { ParticipantTable } from "../../../src/components/ui/ParticipantTable";
import StatsCard from "./StatsCard";
import RandomPositionGrid from "./RandomPositionGrid";

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
                <button onClick={handleExportCSV} className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] text-white text-xs font-bold rounded-xl px-5 py-2.5 flex items-center justify-center gap-1.5 shadow-md">
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
              <div className="py-12 text-center text-xs text-gray-400 font-semibold">No participants match "{searchTerm}"</div>
            ) : (
              <ParticipantTable
                headers={["Name", "Email", "Position", "Action"]}
                enableBulkSelection={true}
                isAllPageSelected={isAllPageSelected(paginatedParticipants)}
                onSelectAllToggle={() => handleSelectAllToggle(paginatedParticipants)}
              >
                {paginatedParticipants.map((p) => {
                  const isRowSelected = selectedIds.has(p.id);
                  const positionText = p.assignedNumber ? `Position #${p.assignedNumber}` : "Unassigned";
                  return (
                    <tr key={p.id} className={`hover:bg-gray-50/40 transition-colors ${isRowSelected ? "bg-blue-50/10" : ""}`}>
                      <td className="py-4 px-6 text-center">
                        <input type="checkbox" checked={isRowSelected} onChange={() => handleSelectRow(p.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                      </td>
                      <td className="py-4 px-6 font-bold text-gray-900 capitalize font-heading">{p.name}</td>
                      <td className="py-4 px-6 font-mono text-xs text-gray-500">{p.email || "-"}</td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${p.assignedNumber ? "bg-purple-50 text-[#8338EC] border-purple-100" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                          {positionText}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button disabled={isDeleting === p.id} onClick={() => handleRemove(p.id, p.name)} className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-bold border border-red-100 disabled:opacity-50">
                          {isDeleting === p.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </ParticipantTable>
            )}

            {totalPages > 1 && (
              <PaginationBar 
                currentPage={currentPage} 
                totalPages={totalPages} 
                pageSize={pageSize} 
                onPageChange={setCurrentPage} 
                onPageSizeChange={setPageSize}
                totalCount={totalCount}
                startEntryIndex={startEntryIndex}
                endEntryIndex={endEntryIndex}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RandomPositioningResult;
