"use client";
import React, { useState, useMemo } from "react";
import { FaSearch, FaTrashAlt } from "react-icons/fa";
import { SecretSantaPairing } from "../../../src/types";
import { usePagination } from "../../../src/hooks/usePagination";
import { useBulkSelection } from "../../../src/hooks/useBulkSelection";
import { useSecretSantaActions } from "../../../src/hooks/useSecretSantaActions";
import { PaginationBar } from "../../../src/components/ui/PaginationBar";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { ParticipantTable } from "../../../src/components/ui/ParticipantTable";
import { PairsGrid } from "./PairsGrid";
import { formatTimeAgo } from "../../../src/utils/timeUtils";
import { ConfirmationModal } from "../../../src/components/ui/ConfirmationModal";
import { toast } from "react-toastify";

interface SecretSantaListProps {
  pairing: SecretSantaPairing;
  userId: string;
  isPublicView?: boolean;
}

const SecretSantaList: React.FC<SecretSantaListProps> = ({ pairing, userId, isPublicView = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBulkImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      const { parseParticipantsCsv } = await import("../../../src/utils/csvImport");
      const { addParticipantToSecretSanta } = await import("../../../src/services/endpoints");
      const parsed = await parseParticipantsCsv(file);
      if (parsed.length === 0) {
        toast.error("No valid participants found in CSV file.");
        return;
      }

      let count = 0;
      for (const p of parsed) {
        if (p.name || p.email) {
          await addParticipantToSecretSanta(userId, pairing.id, {
            name: p.name || (p.email ? p.email.split("@")[0] : "Participant"),
            email: p.email || "",
            wishlist: p.wishlist || "",
          });
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

  const handleExportParticipantsCSV = () => {
    const participantsList = pairing.participants || [];
    if (participantsList.length === 0) {
      toast.info("No participants to export.");
      return;
    }
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Name,Email,Wishlist,Assignment\n";

      participantsList.forEach((p) => {
        let assignmentName = "Not Assigned Yet";
        if (pairing.config?.allowWishlist === false) {
          const partner = pairing.participants.find(
            (other) => other.pairIndex === p.pairIndex && other.id !== p.id
          );
          assignmentName = partner 
            ? `Paired with ${partner.name} (Pair ${(p.pairIndex ?? 0) + 1})` 
            : `Awaiting partner (Pair ${(p.pairIndex ?? 0) + 1})`;
        } else if (pairing.status === "locked" && pairing.pairs) {
          const pair = pairing.pairs.find(pair => pair.santaId === p.id);
          const receiver = pair && pairing.participants.find(r => r.id === pair.receiverId);
          if (receiver) {
            assignmentName = receiver.name || "";
          }
        }
        csvContent += `"${p.name}","${p.email || ""}","${p.wishlist || ""}","${assignmentName}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${pairing.groupingPurpose.replace(/\s+/g, "_")}_participants.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Participants list exported!");
    } catch {
      toast.error("Failed to export participants.");
    }
  };

  // Compile all participants
  const participantsList = pairing.participants || [];
  const filteredParticipants = useMemo(() => participantsList.filter(p =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.wishlist || "").toLowerCase().includes(searchTerm.toLowerCase())
  ), [participantsList, searchTerm]);

  const { currentPage, pageSize, totalPages, paginatedItems, startEntryIndex, endEntryIndex, totalCount, setCurrentPage, setPageSize } = usePagination(filteredParticipants, 8);
  const { selectedIds, isAllPageSelected, handleSelectAllToggle, handleSelectRow, clearSelection } = useBulkSelection();
  const { isDeleting, handleClearSlot, handleBulkClearSlots, handleGenerateClick } = useSecretSantaActions(pairing, userId, selectedIds, clearSelection);

  const headers = ["Name", ...(pairing.config?.allowWishlist !== false ? ["Wishlist"] : []), "Assignment", "Joined Time", ...(pairing.status !== "locked" ? ["Actions"] : [])];

  return (
    <div className="flex flex-col gap-8">
      <PairsGrid pairing={pairing} />
      
      {!isPublicView && (
        <div className="flex flex-col gap-4 text-left border-t border-gray-100 pt-8">
          <h3 className="text-2xl font-bold text-gray-900 font-heading">All Participants</h3>
          <div className="bg-white rounded-[2rem] border border-gray-150/40 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
              <div><h4 className="text-base font-bold text-gray-900">Participants List</h4></div>
              <div className="flex items-center gap-2">
                <div className="relative flex items-center border rounded-xl px-3.5 py-2 w-full sm:w-64">
                  <FaSearch className="text-gray-400 mr-2" />
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="outline-none text-xs w-full" />
                </div>
                {pairing.config?.allowWishlist !== false && pairing.status !== "locked" && participantsList.length > 0 && (
                  <button onClick={() => setIsModalOpen(true)} className="bg-[#047857] text-white text-xs font-bold rounded-xl px-5 py-2.5">Generate pairs</button>
                )}

                {/* Import CSV Button */}
                {pairing.status !== "locked" && (
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

                {/* Export CSV button */}
                <button
                  type="button"
                  onClick={handleExportParticipantsCSV}
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

            {selectedIds.size > 0 && pairing.status !== "locked" && (
              <div className="bg-blue-50/50 px-6 py-3 flex justify-between">
                <span className="text-xs font-bold text-blue-700">{selectedIds.size} selected</span>
                <button onClick={handleBulkClearSlots} disabled={!!isDeleting} className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"><FaTrashAlt />Remove</button>
              </div>
            )}

            {participantsList.length === 0 ? <EmptyState message="No participants yet." /> : filteredParticipants.length === 0 ? <div className="py-12 text-center text-xs text-gray-400">No matches</div> : (
              <ParticipantTable
                headers={headers}
                enableBulkSelection={true}
                isAllPageSelected={isAllPageSelected(paginatedItems)}
                onSelectAllToggle={() => handleSelectAllToggle(paginatedItems)}
                selectedIds={Array.from(selectedIds)}
                onSelectOneToggle={handleSelectRow}
                rows={paginatedItems.map((p) => {
                  let assignmentText = "-";
                  if (pairing.config?.allowWishlist === false) {
                    const partner = pairing.participants.find(other => other.pairIndex === p.pairIndex && other.id !== p.id);
                    assignmentText = partner ? `Paired with ${partner.name}` : "Awaiting partner";
                  } else if (pairing.status === "locked" && pairing.pairs) {
                    const pair = pairing.pairs.find(pair => pair.santaId === p.id);
                    const receiver = pair && pairing.participants.find(r => r.id === pair.receiverId);
                    if (receiver) assignmentText = `Gifting to ${receiver.name}`;
                  }

                  return {
                    id: p.id,
                    cells: [
                      <div key="name" className="flex flex-col"><span className="font-bold text-gray-900">{p.name}</span><span className="text-[10px] text-gray-400">{p.email}</span></div>,
                      ...(pairing.config?.allowWishlist !== false ? [<span key="wishlist" className="text-xs text-gray-600 max-w-xs truncate">{p.wishlist || "No wishlist"}</span>] : []),
                      <span key="assign" className="text-xs font-semibold text-blue-600">{assignmentText}</span>,
                      <span key="time" className="text-[10px] text-gray-400">{formatTimeAgo((p as any).createdAt)}</span>,
                      ...(pairing.status !== "locked" ? [
                        <button key="action" onClick={() => handleClearSlot(p.id, p.name)} disabled={isDeleting === p.id} className="text-red-500 text-xs font-bold hover:text-red-700">Remove</button>
                      ] : [])
                    ]
                  };
                })}
              />
            )}

            <PaginationBar currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalCount={totalCount} startEntryIndex={startEntryIndex} endEntryIndex={endEntryIndex} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleGenerateClick} title="Generate Secret Santa Pairs" message="Are you sure? This will pair all participants and send email notifications." confirmText="Generate & Send" />
    </div>
  );
};

export default SecretSantaList;
