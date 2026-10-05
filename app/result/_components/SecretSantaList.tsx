"use client";
import { ImportCsvButton, ExportCsvButton } from "@/components/ui/CsvButtons";
import { downloadCsv, fileStem } from "@/utils/csv";
import React, { useState, useMemo } from "react";
import { FaSearch, FaTrashAlt } from "react-icons/fa";
import { SecretSantaPairing } from "@/types";
import { usePagination } from "@/hooks/usePagination";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useSecretSantaActions } from "@/hooks/useSecretSantaActions";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ParticipantTable } from "@/components/ui/ParticipantTable";
import { PairsGrid } from "./PairsGrid";
import { formatTimeAgo } from "@/utils/timeUtils";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { toast } from "react-toastify";
import { ExclusionsEditor } from "./ExclusionsEditor";

interface SecretSantaListProps {
  pairing: SecretSantaPairing;
  userId: string;
  isPublicView?: boolean;
}

const SecretSantaList: React.FC<SecretSantaListProps> = ({ pairing, userId, isPublicView = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);


  const assignmentFor = (p: SecretSantaPairing["participants"][number], pending: string) => {
    if (pairing.config?.allowWishlist === false) {
      const partner = pairing.participants.find((other) => other.pairIndex === p.pairIndex && other.id !== p.id);
      return partner ? `Paired with ${partner.name}` : "Awaiting partner";
    }
    const pair = pairing.status === "locked" ? pairing.pairs?.find((x) => x.santaId === p.id) : undefined;
    const receiver = pair && pairing.participants.find((r) => r.id === pair.receiverId);
    return receiver ? `Gifting to ${receiver.name}` : pending;
  };

  const handleExportParticipantsCSV = () => {
    const list = pairing.participants || [];
    if (list.length === 0) {
      toast.info("No participants to export.");
      return;
    }
    downloadCsv(
      `${fileStem(pairing.groupingPurpose)}_participants.csv`,
      ["Name", "Email", "Wishlist", "Assignment"],
      list.map((p) => [p.name, p.email, p.wishlist, assignmentFor(p, "Not Assigned Yet")])
    );
    toast.success("Participants list exported!");
  };

  // Compile all participants
  const participantsList = useMemo(() => pairing.participants || [], [pairing.participants]);
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
      
      {!isPublicView && pairing.config?.allowWishlist && pairing.status !== "locked" && participantsList.length >= 2 && (
        <ExclusionsEditor pairing={pairing} />
      )}

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

                {pairing.status !== "locked" && <ImportCsvButton eventId={pairing.id} />}
                <ExportCsvButton onClick={handleExportParticipantsCSV} />
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
                  const assignmentText = assignmentFor(p, "-");

                  return {
                    id: p.id,
                    cells: [
                      <div key="name" className="flex flex-col"><span className="font-bold text-gray-900">{p.name}</span><span className="text-[10px] text-gray-400">{p.email}</span></div>,
                      ...(pairing.config?.allowWishlist !== false ? [<span key="wishlist" className="text-xs text-gray-600 max-w-xs truncate">{p.wishlist || "No wishlist"}</span>] : []),
                      <span key="assign" className="text-xs font-semibold text-blue-600">{assignmentText}</span>,
                      <span key="time" className="text-[10px] text-gray-400">{formatTimeAgo(p.joinedAt)}</span>,
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

      <ConfirmationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onConfirm={handleGenerateClick} title="Generate Secret Santa Pairs" message="Are you sure? This will pair all participants and send each person their match privately." confirmText="Generate & Send" />
    </div>
  );
};

export default SecretSantaList;
