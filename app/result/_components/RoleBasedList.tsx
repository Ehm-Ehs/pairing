import { useState } from "react";
import { Badge } from "../../../src/components/ui/Badge";
import { RoleBasedPairing, Participant } from "../../../src/types";
import { capitalizeWords } from "../../../src/utils/stringUtils";
import { getGravatarUrl } from "../../../src/utils/avatar";
import { FaSearch, FaFileDownload, FaTrashAlt } from "react-icons/fa";
import { auth } from "../../../src/services/firebase";
import { usePagination } from "../../../src/hooks/usePagination";
import { useBulkSelection } from "../../../src/hooks/useBulkSelection";
import { useRoleBasedActions } from "../../../src/hooks/useRoleBasedActions";
import { PaginationBar } from "../../../src/components/ui/PaginationBar";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { ParticipantTable } from "../../../src/components/ui/ParticipantTable";
import RoleGrid, { getRoleBadgeStyle } from "./RoleGrid";

interface RoleBasedListProps {
  pairing: RoleBasedPairing;
  isPublicView?: boolean;
}

const RoleBasedList = ({ pairing, isPublicView = false }: RoleBasedListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [unblurredGroupKey, setUnblurredGroupKey] = useState<string | null>(null);

  const storageUid = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "{}")?.uid : "";
  const userId = auth.currentUser?.uid || storageUid || "";

  const isRestricted = isPublicView && pairing.visibilityMode === "restricted";

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim()) {
      setUnblurredGroupKey(null);
      return;
    }
    const cleanEmail = lookupEmail.trim().toLowerCase();
    let foundGroupKey: string | null = null;

    Object.entries(pairing.groups || {}).forEach(([gKey, group]) => {
      if (group.some((m) => m.email?.toLowerCase() === cleanEmail)) {
        foundGroupKey = gKey;
      }
    });

    if (foundGroupKey) {
      setUnblurredGroupKey(foundGroupKey);
    } else {
      import("react-toastify").then(({ toast }) => {
        toast.error("Email not found in participant list.");
      });
    }
  };

  const filledParticipants: (Participant & { groupKey: string; groupNum: number })[] = [];
  Object.entries(pairing.groups || {}).forEach(([groupKey, group]) => {
    const digits = groupKey.replace(/\D+/g, "");
    const parsedNum = digits ? parseInt(digits, 10) : 1;
    const groupNum = groupKey.toLowerCase().startsWith("group_0") || groupKey === "0" ? parsedNum + 1 : parsedNum;
    group.forEach((member) => {
      if (member.name && member.name.trim() !== "") {
        filledParticipants.push({ ...member, groupKey, groupNum });
      }
    });
  });

  const filteredParticipants = filledParticipants.filter((p) =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.role || "").toLowerCase().includes(searchTerm.toLowerCase())
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
  } = usePagination(filteredParticipants, 8);

  const { selectedIds, setSelectedIds, handleSelectRow, handleSelectAllToggle, isAllPageSelected } = useBulkSelection();

  const { isDeleting, handleClearSlot, handleBulkClearSlots } = useRoleBasedActions(pairing, userId, selectedIds, setSelectedIds);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleExportParticipantsCSV = () => {
    if (filledParticipants.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,Name,Email,Role,Assigned Group\n";
    filledParticipants.forEach((p) => {
      csvContent += `"${p.name}","${p.email}","${p.role}","Group ${p.groupNum}"\n`;
    });
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${pairing.groupingPurpose.replace(/\s+/g, "_")}_participants.csv`;
    link.click();
  };

  return (
    <div className="flex flex-col gap-8">
      {pairing.characteristics && pairing.characteristics.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-150/40 shadow-sm text-left">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Characteristics Distribution {pairing.characteristicsLabel && `- ${pairing.characteristicsLabel.toUpperCase()}`}
          </h3>
          <div className="flex flex-wrap gap-2">
            {pairing.characteristics.map((char, i) => (
              <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1 text-xs font-semibold capitalize">
                {capitalizeWords(char.name)}: {char.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {isRestricted && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-blue-500/10 border border-amber-200/80 rounded-3xl p-5 md:p-6 text-left shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
              Restricted Visibility Mode
            </span>
            <h4 className="text-base font-bold text-gray-900 font-heading">
              Looking for your assigned group?
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              Enter your registered email below to unblur and reveal your group members! (Available slots remain open).
            </p>
          </div>
          <form onSubmit={handleLookupSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="email"
              placeholder="Your registered email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-64"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex-shrink-0 cursor-pointer"
            >
              Reveal My Group
            </button>
          </form>
        </div>
      )}

      <div className="flex flex-col gap-4 text-left">
        <h3 className="text-2xl font-bold text-gray-900 font-heading">Groups</h3>
        <RoleGrid
          pairing={pairing}
          isDeleting={isDeleting}
          handleClearSlot={handleClearSlot}
          isPublicView={isPublicView}
          unblurredGroupKey={unblurredGroupKey}
        />
      </div>

      {!isPublicView && (
        <div className="flex flex-col gap-4 text-left border-t border-gray-100 pt-8">
          <h3 className="text-2xl font-bold text-gray-900 font-heading">All Participants</h3>
          <div className="bg-white rounded-[2rem] border border-gray-150/40 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-gray-900">Participants List</h4>
                <p className="text-xs text-gray-400">View and manage all participants</p>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && pairing.status !== "locked" && (
                  <button onClick={handleBulkClearSlots} disabled={isDeleting !== null} className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-bold gap-2">
                    <FaTrashAlt /> Remove Selected ({selectedIds.size})
                  </button>
                )}
                <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2 w-full sm:w-64 shadow-sm">
                  <FaSearch className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
                  <input type="text" placeholder="Search participant" value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)} className="bg-transparent border-0 outline-none text-xs w-full placeholder-gray-400 text-gray-700 font-medium" />
                </div>
                <button onClick={handleExportParticipantsCSV} disabled={filledParticipants.length === 0} className="flex items-center justify-center p-2.5 bg-gray-50 text-gray-600 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <FaFileDownload className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filledParticipants.length === 0 ? (
              <EmptyState message="No participants yet. Share the link to invite people!" />
            ) : filteredParticipants.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 font-semibold">No participants match "{searchTerm}"</div>
            ) : (
              <ParticipantTable
                headers={["Name", "Email", "Role", "Group"]}
                enableBulkSelection={true}
                isAllPageSelected={isAllPageSelected(paginatedParticipants)}
                onSelectAllToggle={() => handleSelectAllToggle(paginatedParticipants)}
              >
                {paginatedParticipants.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-center">
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => handleSelectRow(p.id)} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={getGravatarUrl(p.email, p.name)} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-gray-100" />
                        <p className="font-bold text-gray-900 capitalize font-heading">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-500">{p.email || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full capitalize ${getRoleBadgeStyle(p.role)}`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-600">Group {p.groupNum}</td>
                  </tr>
                ))}
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

export default RoleBasedList;
