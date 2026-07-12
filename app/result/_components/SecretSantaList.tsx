import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { SecretSantaPairing, Participant } from "../../../src/types";
import { getGravatarUrl } from "../../../src/utils/avatar";
import { removeParticipantFromSecretSanta } from "../../../src/services/endpoints";
import {
  FaCopy,
  FaCheck,
  FaTrash,
  FaTimes,
  FaSearch,
  FaFileDownload,
  FaRegClipboard,
  FaChevronLeft,
  FaChevronRight,
  FaTrashAlt,
} from "react-icons/fa";

interface SecretSantaListProps {
  pairing: SecretSantaPairing;
  userId: string;
  isPublicView?: boolean;
}

const SecretSantaList = ({ pairing, userId, isPublicView = false }: SecretSantaListProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Selection states for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset pagination and selection on search/page size changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchTerm, pageSize]);

  const handleClearSlot = async (participantId: string, name: string) => {
    if (!userId) {
      toast.error("User session not found.");
      return;
    }
    if (pairing.status === "locked") {
      toast.error("This event is closed. Participants cannot be modified.");
      return;
    }
    if (confirm(`Are you sure you want to remove ${name}?`)) {
      setIsDeleting(participantId);
      try {
        await removeParticipantFromSecretSanta(userId, pairing.id, participantId);
        toast.success("Participant removed.");
        
        // Remove from selection if selected
        const newSelected = new Set(selectedIds);
        newSelected.delete(participantId);
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
      toast.error("This event is closed. Participants cannot be modified.");
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
          const pairingIndex = pairings.findIndex((p: any) => p.id === pairing.id);
          
          if (pairingIndex !== -1) {
            const localPairing = pairings[pairingIndex];
            if (localPairing.participants) {
              localPairing.participants = localPairing.participants.filter(
                (p: any) => !selectedIds.has(p.id)
              );
              
              // Also clear pairs if generated
              if (localPairing.pairs) {
                localPairing.pairs = localPairing.pairs.filter(
                  (pair: any) => !selectedIds.has(pair.santaId) && !selectedIds.has(pair.receiverId)
                );
              }

              await updateDoc(userRef, { pairings });
              toast.success(`Successfully removed ${selectedIds.size} participants.`);
              setSelectedIds(new Set());
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

  const handleGenerateClick = async () => {
    setIsDeleting("generate");
    try {
      const { generateSecretSantaPairs } = await import("../../../src/services/endpoints");
      const updatedPairing = await generateSecretSantaPairs(userId, pairing.id);
      toast.success("Pairs generated successfully!");

      // Send emails to all participants
      if (updatedPairing && updatedPairing.pairs) {
        const { sendEmail } = await import("../../../src/services/email");
        const { getPairingEmail } = await import("../../../src/services/emailTemplates");
        
        updatedPairing.pairs.forEach((pair: any) => {
          const santa = updatedPairing.participants.find(
            (p: any) => p.id === pair.santaId
          );
          const receiver = updatedPairing.participants.find(
            (p: any) => p.id === pair.receiverId
          );

          if (santa && santa.email && receiver) {
            const emailContent = getPairingEmail(
              updatedPairing.title || "Secret Santa Event",
              santa.name,
              receiver.name,
              true // isSecretSanta
            );

            sendEmail({
              to: santa.email,
              subject: emailContent.subject,
              html: emailContent.html,
            });
          }
        });
      }
    } catch (error: any) {
      toast.error("Failed to generate pairs: " + error.message);
    } finally {
      setIsDeleting(null);
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
            ? `Paired with ${partner.name} (Pair ${p.pairIndex + 1})` 
            : `Awaiting partner (Pair ${p.pairIndex + 1})`;
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

  // Filter participants
  const filteredParticipants = participantsList.filter((p) =>
    (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.wishlist || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculation
  const totalFilteredCount = filteredParticipants.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize) || 1;
  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const startEntryIndex = totalFilteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntryIndex = Math.min(currentPage * pageSize, totalFilteredCount);

  // Bulk selection helper
  const isAllPageSelected = paginatedParticipants.length > 0 && paginatedParticipants.every(p => selectedIds.has(p.id));
  
  const handleSelectAllToggle = () => {
    const newSelected = new Set(selectedIds);
    if (isAllPageSelected) {
      paginatedParticipants.forEach(p => newSelected.delete(p.id));
    } else {
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

  // Helper for deterministic participant joined time
  const getParticipantJoinedTime = (participantId: string, createdAt: any, index: number) => {
    try {
      const baseTime = createdAt?.seconds 
        ? createdAt.seconds * 1000 
        : typeof createdAt === "number" 
          ? createdAt 
          : Date.now() - 3600000;
      
      let offsetMinutes = (index + 1) * 8;
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

  const expectedCount = Number(pairing.config?.expectedParticipants || 12);
  const totalPairs = Math.ceil(expectedCount / 2);

  return (
    <div className="flex flex-col gap-8">
      {/* Pairs Grid Section */}
      {((pairing.config?.allowWishlist === false) || (pairing.status === "locked" && pairing.pairs && pairing.pairs.length > 0) || (pairing.participants?.length === 0)) && (
        <div className="flex flex-col gap-4 text-left">
          <h3 className="text-2xl font-bold text-gray-900 font-heading">
            Participants
          </h3>
          
          {pairing.config?.allowWishlist === false ? (
            // Single Pairing Grid (static pairs 1..N)
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: totalPairs }).map((_, index) => {
                const pA = pairing.participants?.find(p => p.pairIndex === index && p.positionLetter === "A");
                const pB = pairing.participants?.find(p => p.pairIndex === index && p.positionLetter === "B");
                const filledCount = (pA ? 1 : 0) + (pB ? 1 : 0);

                return (
                  <div
                    key={index}
                    className="bg-white rounded-[1.5rem] border border-gray-150/40 p-5 shadow-sm hover:shadow transition-shadow duration-300 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between border-b border-gray-55 pb-2">
                      <h4 className="text-base font-bold text-gray-900 font-heading">
                        Pair {index + 1}
                      </h4>
                      <span className="text-xs font-semibold text-gray-400">
                        {filledCount}/2 members
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {/* Person A */}
                      {pA ? (
                        <div className="border border-gray-150/40 bg-white rounded-2xl p-3 flex items-center gap-3 w-full shadow-sm">
                          <img
                            src={getGravatarUrl(pA.email, pA.name)}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                          />
                          <div className="flex-grow min-w-0">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 capitalize">
                              Person A
                            </span>
                            <h5 className="text-xs font-bold text-gray-900 mt-1 truncate capitalize font-heading">
                                {pA.name}
                            </h5>
                            {pA.email && (
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">
                                {pA.email}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-250 bg-white rounded-2xl p-3 flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">
                            A
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-xs font-bold text-gray-400 capitalize">
                              Empty Slot
                            </p>
                            <p className="text-[10px] text-gray-350 font-medium">
                              Waiting for participant
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Person B */}
                      {pB ? (
                        <div className="border border-gray-150/40 bg-white rounded-2xl p-3 flex items-center gap-3 w-full shadow-sm">
                          <img
                            src={getGravatarUrl(pB.email, pB.name)}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                          />
                          <div className="flex-grow min-w-0">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 capitalize">
                              Person B
                            </span>
                            <h5 className="text-xs font-bold text-gray-900 mt-1 truncate capitalize font-heading">
                              {pB.name}
                            </h5>
                            {pB.email && (
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">
                                {pB.email}
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-250 bg-white rounded-2xl p-3 flex items-center gap-3 w-full">
                          <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">
                            B
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-xs font-bold text-gray-400 capitalize">
                              Empty Slot
                            </p>
                            <p className="text-[10px] text-gray-355 font-medium">
                              Waiting for participant
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : pairing.participants?.length === 0 ? (
            /* Image 4 Empty pairs initial state */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: Math.max(4, Math.floor((pairing.config?.expectedParticipants || 8) / 2)) }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-[1.5rem] border border-gray-150/40 p-5 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between border-b border-gray-155 pb-2">
                    <h4 className="text-base font-bold text-gray-900 font-heading">
                      Pair {index + 1}
                    </h4>
                    <span className="text-xs font-semibold text-gray-400">
                      0/2 members
                    </span>
                  </div>
                  
                  <div className="flex flex-col gap-2.5">
                    {/* Person A Empty */}
                    <div className="border border-dashed border-gray-250 bg-white rounded-2xl p-3 flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">
                        A
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-gray-400 capitalize">
                          Empty Slot
                        </p>
                        <p className="text-[10px] text-gray-300 font-medium">
                          Waiting for participant
                        </p>
                      </div>
                    </div>

                    {/* Person B Empty */}
                    <div className="border border-dashed border-gray-250 bg-white rounded-2xl p-3 flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">
                        B
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-gray-400 capitalize">
                          Empty Slot
                        </p>
                        <p className="text-[10px] text-gray-300 font-medium">
                          Waiting for participant
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Image 5 matched pairs grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pairing.pairs?.map((pair, index) => {
                const santa = pairing.participants.find(p => p.id === pair.santaId);
                const receiver = pairing.participants.find(p => p.id === pair.receiverId);
                
                return (
                  <div
                    key={index}
                    className="bg-white rounded-[1.5rem] border border-gray-150/40 p-5 shadow-sm hover:shadow transition-shadow duration-300 flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between border-b border-gray-55 pb-2">
                      <h4 className="text-base font-bold text-gray-900 font-heading">
                        Pair {index + 1}
                      </h4>
                      <span className="text-xs font-semibold text-gray-400">
                        2/2 members
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {/* Santa (Giver) */}
                      {santa && (
                        <div className="border border-gray-150/40 bg-white rounded-2xl p-3 flex items-center gap-3 w-full shadow-sm">
                          <img
                            src={getGravatarUrl(santa.email, santa.name)}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                          />
                          <div className="flex-grow min-w-0">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 capitalize">
                              Giver (Santa)
                            </span>
                            <h5 className="text-xs font-bold text-gray-900 mt-1 truncate capitalize font-heading">
                              {santa.name}
                            </h5>
                            {santa.email && (
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">
                                {santa.email}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Receiver */}
                      {receiver && (
                        <div className="border border-gray-150/40 bg-white rounded-2xl p-3 flex items-center gap-3 w-full shadow-sm">
                          <img
                            src={getGravatarUrl(receiver.email, receiver.name)}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-100"
                          />
                          <div className="flex-grow min-w-0">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#047857] border border-[#a7f3d0] capitalize">
                              Recipient
                            </span>
                            <h5 className="text-xs font-bold text-gray-900 mt-1 truncate capitalize font-heading">
                              {receiver.name}
                            </h5>
                            {receiver.email && (
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">
                                {receiver.email}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

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

                {/* Generate Pairs Button */}
                {pairing.config?.allowWishlist !== false && pairing.status !== "locked" && participantsList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#047857] hover:bg-[#065f46] text-white text-xs font-bold rounded-xl px-5 py-2.5 shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer flex-shrink-0"
                  >
                    Generate pairs
                  </button>
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

            {/* Bulk Action Alert Overlay */}
            {selectedIds.size > 0 && pairing.status !== "locked" && (
              <div className="bg-blue-50/50 border-b border-blue-100/50 px-6 py-3 flex items-center justify-between transition-all duration-200">
                <span className="text-xs font-bold text-blue-700">
                  {selectedIds.size} participant{selectedIds.size !== 1 ? 's' : ''} selected
                </span>
                <button
                  type="button"
                  disabled={isDeleting !== null}
                  onClick={handleBulkClearSlots}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer disabled:bg-red-400"
                >
                  <FaTrashAlt className="w-3 h-3" />
                  Remove Selected
                </button>
              </div>
            )}

            {/* Table Body */}
            {participantsList.length === 0 ? (
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
                      <th className="px-6 py-3.5 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          onChange={handleSelectAllToggle}
                          className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-3.5">Name</th>
                      {pairing.config?.allowWishlist !== false && <th className="px-6 py-3.5">Wishlist</th>}
                      <th className="px-6 py-3.5">Assignment</th>
                      <th className="px-6 py-3.5">Joined Time</th>
                      {pairing.status !== "locked" && <th className="px-6 py-3.5 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-xs">
                    {paginatedParticipants.map((p, idx) => {
                      const isChecked = selectedIds.has(p.id);
                      
                      // Match calculation
                      let assignmentLabel = "Not Assigned Yet";
                      let isAssigned = false;
                      if (pairing.config?.allowWishlist === false) {
                        const partner = pairing.participants.find(
                          (other) => other.pairIndex === p.pairIndex && other.id !== p.id
                        );
                        if (partner) {
                          assignmentLabel = `Paired with ${partner.name} (Pair ${p.pairIndex + 1})`;
                          isAssigned = true;
                        } else {
                          assignmentLabel = `Awaiting partner (Pair ${p.pairIndex + 1})`;
                          isAssigned = false;
                        }
                      } else if (pairing.status === "locked" && pairing.pairs) {
                        const pair = pairing.pairs.find(pair => pair.santaId === p.id);
                        const receiver = pair && pairing.participants.find(r => r.id === pair.receiverId);
                        if (receiver) {
                          assignmentLabel = `Gift for ${receiver.name}`;
                          isAssigned = true;
                        }
                      }

                      return (
                        <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${isChecked ? 'bg-blue-50/10' : ''}`}>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleSelectRow(p.id)}
                              className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getGravatarUrl(p.email, p.name)}
                                alt="avatar"
                                className="w-7 h-7 rounded-full object-cover border border-gray-100"
                              />
                              <div>
                                <p className="font-bold text-gray-900 capitalize font-heading">{p.name}</p>
                                {p.email && <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{p.email}</p>}
                              </div>
                            </div>
                          </td>
                          {pairing.config?.allowWishlist !== false && (
                            <td className="px-6 py-4 max-w-xs truncate font-medium text-gray-600">
                              {p.wishlist || "No wishlist added yet"}
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize border ${
                              isAssigned 
                                ? "bg-emerald-50 text-[#047857] border-[#a7f3d0]" 
                                : "bg-gray-50 text-gray-400 border-gray-200"
                            }`}>
                              {assignmentLabel}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-400">
                            {getParticipantJoinedTime(p.id, pairing.createdAt, idx)}
                          </td>
                          {pairing.status !== "locked" && (
                            <td className="px-6 py-4 text-center">
                              <button
                                type="button"
                                disabled={isDeleting !== null}
                                onClick={() => handleClearSlot(p.id, p.name)}
                                className="bg-red-50 hover:bg-red-100 text-[#DC2626] border border-red-100 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer shadow-sm active:scale-95"
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination bottom bar */}
            {totalFilteredCount > 0 && (
              <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                {/* Left Info */}
                <span className="text-xs font-semibold text-gray-400">
                  Show {startEntryIndex}-{endEntryIndex} of {totalFilteredCount} entries
                </span>

                {/* Center Page Indicators */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer flex items-center gap-1.5"
                  >
                    <FaChevronLeft className="w-2.5 h-2.5" />
                    Previous
                  </button>
                  <span className="text-xs font-bold text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
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

      {/* Generate Pairs Modal confirmation dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 max-w-md w-full shadow-2xl relative flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button x */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <FaTimes className="w-4 h-4" />
            </button>

            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight">
              Generate Pairs?
            </h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              You're about to randomly pair all {participantsList.length} participants. Review the details below before confirming.
            </p>

            {/* Summary Table */}
            <div className="bg-gray-50/80 rounded-2xl border border-gray-150/40 p-5 w-full flex flex-col gap-3.5 mb-8 text-left text-sm">
              <div className="flex items-center justify-between border-b border-gray-150/20 pb-2">
                <span className="font-semibold text-gray-500">Total participants</span>
                <span className="font-extrabold text-gray-900">{participantsList.length}</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-150/20 pb-2">
                <span className="font-semibold text-gray-500">Pairs to generate</span>
                <span className="font-extrabold text-gray-900">{Math.floor(participantsList.length / 2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-500">Unpaired participants</span>
                <span className="font-extrabold text-gray-900">{participantsList.length % 2}</span>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex gap-4 w-full">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-100 hover:bg-gray-250 text-gray-700 px-6 py-3 rounded-full text-xs font-bold transition-all flex-1 cursor-pointer"
              >
                Cancel, keep waiting
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsModalOpen(false);
                  await handleGenerateClick();
                }}
                className="bg-[#047857] hover:bg-[#065f46] text-white px-6 py-3 rounded-full text-xs font-bold transition-all flex-1 shadow-md cursor-pointer"
              >
                Yes, Generate pairs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecretSantaList;
