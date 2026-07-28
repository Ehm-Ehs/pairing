import { useState, useMemo } from "react";
import { SecretSantaPairing } from "../../../src/types";
import { getGravatarUrl } from "../../../src/utils/avatar";
import { FaSearch, FaTrashAlt } from "react-icons/fa";
import { usePagination } from "../../../src/hooks/usePagination";
import { useBulkSelection } from "../../../src/hooks/useBulkSelection";
import { useSecretSantaActions } from "../../../src/hooks/useSecretSantaActions";
import { PaginationBar } from "../../../src/components/ui/PaginationBar";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { ConfirmationModal } from "../../../src/components/ui/ConfirmationModal";
import { ParticipantTable } from "../../../src/components/ui/ParticipantTable";
import { exportSecretSantaCsv } from "../../../src/utils/exportCsv";
import { getParticipantJoinedTime } from "../../../src/utils/timeUtils";
import { PairsGrid } from "./PairsGrid";

interface Props {
  pairing: SecretSantaPairing;
  userId: string;
  isPublicView?: boolean;
}

const SecretSantaList = ({ pairing, userId, isPublicView = false }: Props) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
                <button onClick={() => exportSecretSantaCsv(pairing)} className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] text-white text-xs font-bold rounded-xl px-5 py-2.5">Export</button>
              </div>
            </div>

            {selectedIds.size > 0 && pairing.status !== "locked" && (
              <div className="bg-blue-50/50 px-6 py-3 flex justify-between">
                <span className="text-xs font-bold text-blue-700">{selectedIds.size} selected</span>
                <button onClick={handleBulkClearSlots} disabled={!!isDeleting} className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"><FaTrashAlt />Remove</button>
              </div>
            )}

            {participantsList.length === 0 ? <EmptyState message="No participants yet." /> : filteredParticipants.length === 0 ? <div className="py-12 text-center text-xs text-gray-400">No matches</div> : (
              <ParticipantTable headers={headers} enableBulkSelection={true} isAllPageSelected={isAllPageSelected(paginatedItems)} onSelectAllToggle={() => handleSelectAllToggle(paginatedItems)}>
                {paginatedItems.map((p, idx) => (
                  <tr key={p.id} className={selectedIds.has(p.id) ? 'bg-blue-50/10' : 'hover:bg-gray-50/50'}>
                    <td className="px-6 py-4 text-center"><input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => handleSelectRow(p.id)} className="cursor-pointer" /></td>
                    <td className="px-6 py-4 flex gap-3 items-center">
                      <img src={getGravatarUrl(p.email, p.name)} className="w-7 h-7 rounded-full" alt="avatar" />
                      <div><p className="font-bold text-gray-900">{p.name}</p>{p.email && <p className="text-[10px] text-gray-400">{p.email}</p>}</div>
                    </td>
                    {pairing.config?.allowWishlist !== false && <td className="px-6 py-4">{p.wishlist || "None"}</td>}
                    <td className="px-6 py-4"><span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-gray-50">{p.pairIndex !== undefined ? `Pair ${(p.pairIndex)+1}` : "Not Assigned"}</span></td>
                    <td className="px-6 py-4 text-gray-400 font-semibold">{getParticipantJoinedTime(p.id, pairing.createdAt, idx)}</td>
                    {pairing.status !== "locked" && (
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleClearSlot(p.id, p.name)} disabled={!!isDeleting} className="text-[#DC2626] bg-red-50 border px-3.5 py-1.5 rounded-full text-xs font-bold">Remove</button>
                      </td>
                    )}
                  </tr>
                ))}
              </ParticipantTable>
            )}
            <PaginationBar totalCount={totalCount} startEntryIndex={startEntryIndex} endEntryIndex={endEntryIndex} currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} />
          </div>
        </div>
      )}
      
      <ConfirmationModal isOpen={isModalOpen} title="Generate Pairs?" description={`You're about to randomly pair all ${participantsList.length} participants.`} onConfirm={async () => { setIsModalOpen(false); await handleGenerateClick(); }} onCancel={() => setIsModalOpen(false)} confirmText="Yes, Generate pairs" confirmVariant="success" />
    </div>
  );
};
export default SecretSantaList;
