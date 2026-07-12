import { useState, useEffect } from "react";
import { Badge } from "../../../src/components/ui/Badge";
import { RoleBasedPairing, Participant } from "../../../src/types";
import { editPairingValue } from "../../../src/services/endpoints";
import { auth } from "../../../src/services/firebase";
import { toast } from "react-toastify";
import { getGravatarUrl } from "../../../src/utils/avatar";
import { capitalizeWords } from "../../../src/utils/stringUtils";
import {
  FaTimes,
  FaSearch,
  FaFileDownload,
  FaRegClipboard,
  FaChevronLeft,
  FaChevronRight,
  FaTrashAlt,
} from "react-icons/fa";

interface RoleBasedListProps {
  pairing: RoleBasedPairing;
  isPublicView?: boolean;
}

const RoleBasedList = ({ pairing, isPublicView = false }: RoleBasedListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Selection states for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  let storageUid = "";
  try {
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userStr && userStr !== "null") {
      const parsed = JSON.parse(userStr);
      if (parsed && typeof parsed === "object") {
        storageUid = parsed.uid || "";
      }
    }
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
  }

  const userId = auth.currentUser?.uid || storageUid || "";

  // Reset pagination and selection on search/page size changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchTerm, pageSize]);

  const handleClearSlot = async (groupKey: string, participant: Participant) => {
    if (!userId) {
      toast.error("User session not found.");
      return;
    }
    if (pairing.status === "locked") {
      toast.error("This event is closed. Slots cannot be modified.");
      return;
    }
    if (confirm(`Are you sure you want to remove ${participant.name} from this slot?`)) {
      setIsDeleting(participant.id);
      try {
        await editPairingValue(
          userId,
          pairing.groupingPurpose,
          groupKey,
          0, // editPairingValue resolves the array index via group.findIndex inside, so this param is ignored
          participant.id,
          { name: "", email: "", track: "" } // Clears the slot
        );
        toast.success("Participant removed from slot.");
        
        // Remove from selection if selected
        const newSelected = new Set(selectedIds);
        newSelected.delete(participant.id);
        setSelectedIds(newSelected);
      } catch (err: any) {
        toast.error("Failed to remove participant: " + err.message);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleBulkClearSlots = async () => {
    if (!userId) {
      toast.error("User session not found.");
      return;
    }
    if (pairing.status === "locked") {
      toast.error("This event is closed. Slots cannot be modified.");
      return;
    }
    if (selectedIds.size === 0) return;

    if (confirm(`Are you sure you want to remove the ${selectedIds.size} selected participants?`)) {
      setIsDeleting("bulk");
      try {
        const { doc, getDoc, updateDoc } = await import("firebase/firestore");
        const { db } = await import("../../../src/services/firebase");
        const userRef = doc(db, "Users", userId);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const pairings = userData.pairings || [];
          const pairingIndex = pairings.findIndex(
            (p: any) => p.groupingPurpose === pairing.groupingPurpose
          );
          
          if (pairingIndex !== -1) {
            const localPairing = pairings[pairingIndex];
            let countCleared = 0;
            
            Object.entries(localPairing.groups).forEach(([groupKey, group]: any) => {
              localPairing.groups[groupKey] = group.map((member: any) => {
                if (selectedIds.has(member.id)) {
                  countCleared++;
                  return { ...member, name: "", email: "" };
                }
                return member;
              });
            });

            if (countCleared > 0) {
              await updateDoc(userRef, { pairings });
              toast.success(`Successfully removed ${countCleared} participants.`);
              setSelectedIds(new Set());
            } else {
              toast.error("No selected participants found in groups.");
            }
          }
        }
      } catch (err: any) {
        toast.error("Failed to perform bulk remove: " + err.message);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  // Compile all filled participants
  const filledParticipants: (Participant & { groupKey: string; groupNum: number })[] = [];
  Object.entries(pairing.groups).forEach(([groupKey, group]) => {
    group.forEach((member) => {
      if (member.name && member.name.trim() !== "") {
        filledParticipants.push({
          ...member,
          groupKey,
          groupNum: parseInt(groupKey) + 1,
        });
      }
    });
  });

  // Filter filled participants
  const filteredParticipants = filledParticipants.filter((p) =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculation
  const totalFilteredCount = filteredParticipants.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize) || 1;
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const startEntryIndex = totalFilteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntryIndex = Math.min(currentPage * pageSize, totalFilteredCount);

  // Bulk selection helper
  const isAllPageSelected = paginatedParticipants.length > 0 && paginatedParticipants.every(p => selectedIds.has(p.id));
  
  const handleSelectAllToggle = () => {
    const newSelected = new Set(selectedIds);
    if (isAllPageSelected) {
      // Remove all visible page participants
      paginatedParticipants.forEach(p => newSelected.delete(p.id));
    } else {
      // Add all visible page participants
      paginatedParticipants.forEach(p => newSelected.add(p.id));
    }
    setSelectedIds(newSelected);
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExportParticipantsCSV = () => {
    if (filledParticipants.length === 0) {
      toast.info("No participants to export.");
      return;
    }
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Name,Email,Role,Assigned Group\n";

      filledParticipants.forEach((p) => {
        csvContent += `"${p.name}","${p.email}","${p.role}","Group ${p.groupNum}"\n`;
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

  // Helper for dynamic pastel role badge colors
  const getRoleBadgeStyle = (role: string) => {
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
    // Default fallback
    return "bg-gray-50 text-gray-600 border border-gray-150";
  };

  // Helper for deterministic participant joined time
  const getParticipantJoinedTime = (participantId: string, createdAt: any, participantNumber: number) => {
    try {
      const baseTime = createdAt?.seconds 
        ? createdAt.seconds * 1000 
        : typeof createdAt === "number" 
          ? createdAt 
          : Date.now() - 3600000;
      
      let offsetMinutes = participantNumber * 8;
      if (isNaN(offsetMinutes)) {
        offsetMinutes = 15;
      }
      
      const joinedTimestamp = baseTime + (offsetMinutes * 60 * 1000);
      const finalTimestamp = Math.min(joinedTimestamp, Date.now() - 60000);
      
      const diffMs = Date.now() - finalTimestamp;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
      }
      
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      }
      
      const date = new Date(finalTimestamp);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recent";
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Characteristics Badges */}
      {pairing.characteristics && pairing.characteristics.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-150/40 shadow-sm text-left">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Characteristics Distribution
            {pairing.characteristicsLabel && ` - ${pairing.characteristicsLabel.toUpperCase()}`}
          </h3>
          <div className="flex flex-wrap gap-2">
            {pairing.characteristics.map((char, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1 text-xs font-semibold capitalize"
              >
                {capitalizeWords(char.name)}: {char.count}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Groups Section */}
      <div className="flex flex-col gap-4 text-left">
        <h3 className="text-2xl font-bold text-gray-900 font-heading">
          Groups
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(pairing.groups).map(([groupKey, group], groupIndex) => {
            const totalGroupSlots = group.length;
            const filledGroupSlots = group.filter((p: any) => p.name).length;

            return (
              <div
                key={groupKey}
                className="bg-white rounded-[1.5rem] border border-gray-150/40 p-5 shadow-sm hover:shadow transition-shadow duration-300 flex flex-col gap-4"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-gray-55 pb-2">
                  <h4 className="text-base font-bold text-gray-900 font-heading">
                    Group {groupIndex + 1}
                  </h4>
                  <span className="text-xs font-semibold text-gray-400">
                    {filledGroupSlots}/{totalGroupSlots} members
                  </span>
                </div>

                {/* Slots List */}
                <div className="flex flex-col gap-2.5">
                  {group.map((participant, i) => {
                    const isSlotFilled = !!(participant.name && participant.name.trim() !== "");

                    if (!isSlotFilled) {
                      return (
                        <div
                          key={i}
                          className="border border-dashed border-gray-250 bg-white rounded-2xl p-3 flex items-center gap-3 w-full"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">
                            #{participant.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-400 capitalize">
                              Empty Slot
                            </p>
                            <p className="text-[10px] text-gray-300 font-medium capitalize">
                              {capitalizeWords(participant.role) || "Waiting for participant"}
                            </p>
                          </div>
                        </div>
                      );
                    }

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
                        {pairing.status !== "locked" && (
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
      </div>

      {/* All Participants Section */}
      {!isPublicView && (
        <div className="flex flex-col gap-4 text-left border-t border-gray-100 pt-8">
          <h3 className="text-2xl font-bold text-gray-900 font-heading">
            All Participants
          </h3>

          <div className="bg-white rounded-[2rem] border border-gray-150/40 shadow-sm overflow-hidden flex flex-col">
            {/* Card Header controls */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-gray-900">
                  Participants List
                </h4>
                <p className="text-xs text-gray-400">
                  View and manage all participants
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2 w-full sm:w-64 shadow-sm">
                  <FaSearch className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search participant"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-0 outline-none text-xs w-full placeholder-gray-400 text-gray-700 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Table Body */}
            {filledParticipants.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                <div className="w-28 h-28 bg-[#F3F4F6] rounded-full flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#828282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <line x1="12" y1="10" x2="16" y2="10" />
                    <line x1="12" y1="14" x2="16" y2="14" />
                    <line x1="12" y1="18" x2="16" y2="18" />
                    <circle cx="8.5" cy="10" r="0.75" fill="#828282" />
                    <circle cx="8.5" cy="14" r="0.75" fill="#828282" />
                    <circle cx="8.5" cy="18" r="0.75" fill="#828282" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-500">
                  No participants yet. Share the link to invite people!
                </p>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 font-semibold">
                No participants match "{searchTerm}"
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400 tracking-wider select-none">
                      <th className="px-6 py-3.5">Name</th>
                      <th className="px-6 py-3.5">Email</th>
                      <th className="px-6 py-3.5">Role</th>
                      <th className="px-6 py-3.5">Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {paginatedParticipants.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={getGravatarUrl(p.email, p.name)}
                              alt="avatar"
                              className="w-7 h-7 rounded-full object-cover border border-gray-100"
                            />
                            <p className="font-bold text-gray-900 capitalize font-heading">{p.name || "Available Slot"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-gray-500">{p.email || "-"}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-50 text-[#012A7D] border border-blue-100 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize">
                            {p.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-600">
                          Group {p.groupNum}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls Footer */}
            {totalPages > 1 && (
              <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left Page indicator */}
                <span className="text-xs font-bold text-gray-550 select-none">
                  Page {currentPage} of {totalPages}
                </span>

                {/* Center Navigation Buttons */}
                <div className="flex items-center gap-1.5 select-none">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer flex items-center gap-1.5"
                  >
                    <FaChevronLeft className="w-2.5 h-2.5" />
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer flex items-center gap-1.5"
                  >
                    Next
                    <FaChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>

                {/* Right Page Size Dropdown */}
                <div className="relative">
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(parseInt(e.target.value))}
                    className="bg-white border border-gray-200 rounded-full px-4 py-2 text-xs font-bold text-gray-600 outline-none cursor-pointer appearance-none pr-8 select-none shadow-sm hover:border-gray-300 transition-colors"
                  >
                    <option value={8}>Show 8 entries</option>
                    <option value={12}>Show 12 entries</option>
                    <option value={24}>Show 24 entries</option>
                    <option value={50}>Show 50 entries</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                    <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleBasedList;
