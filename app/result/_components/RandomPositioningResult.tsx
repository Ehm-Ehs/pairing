"use client";
import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaSearch,
  FaFileDownload,
  FaRegClipboard,
  FaChevronLeft,
  FaChevronRight,
  FaTrashAlt,
  FaRandom,
} from "react-icons/fa";
import { RandomPositioningPairing } from "../../../src/types";
import {
  generateRandomPositions,
  removeParticipantFromRandomPositioning,
} from "../../../src/services/endpoints";
import { auth } from "../../../src/services/firebase";
import { Button } from "../../../src/components/ui/button";

interface RandomPositioningResultProps {
  data: RandomPositioningPairing;
}

const RandomPositioningResult: React.FC<RandomPositioningResultProps> = ({
  data,
}) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Reset pagination when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [searchTerm, pageSize]);

  const totalPositions = data.expectedParticipants || 24;
  const totalParticipants = data.participants.length;
  
  // A participant is filled if they have been assigned a number
  const filledParticipants = data.participants.filter((p) => p.assignedNumber && p.assignedNumber > 0);
  const filledCount = filledParticipants.length;
  const availableSlots = Math.max(0, totalPositions - filledCount);
  const capacityPct = totalPositions > 0 ? Math.round((filledCount / totalPositions) * 100) : 0;

  const handleGenerate = async () => {
    if (totalParticipants < 1) {
      toast.error("Need at least 1 participant to shuffle!");
      return;
    }

    if (
      !window.confirm(
        "Are you sure? This will shuffle and assign random positions (1st, 2nd, etc.) to all checked-in participants."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const pairing = await generateRandomPositions(
        auth.currentUser!.uid,
        data.id
      );
      toast.success("Positions successfully generated!");

      if (pairing && pairing.participants) {
        import("../../../src/services/email").then(({ sendEmail }) => {
          import("../../../src/services/emailTemplates").then(
            ({ getPairingEmail }) => {
              pairing.participants.forEach((p: any) => {
                if (p.email && p.assignedNumber) {
                  const emailContent = getPairingEmail(
                    pairing.title || "Random Positioning Event",
                    p.name,
                    `Position #${p.assignedNumber}`,
                    false
                  );

                  sendEmail({
                    to: p.email,
                    subject: emailContent.subject,
                    html: emailContent.html,
                  });
                }
              });
            }
          );
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate positions");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (participantId: string, name: string) => {
    if (data.status === "locked") {
      // In the mockup, organizers can still clear/remove to reassign
    }
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    setIsDeleting(participantId);
    try {
      await removeParticipantFromRandomPositioning(
        auth.currentUser!.uid,
        data.id,
        participantId
      );
      toast.success("Participant removed successfully");
      
      const newSelected = new Set(selectedIds);
      newSelected.delete(participantId);
      setSelectedIds(newSelected);
    } catch (err) {
      toast.error("Failed to remove participant");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Remove ${selectedIds.size} selected participants?`)) return;
    
    setIsDeleting("bulk");
    try {
      const { doc, getDoc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../../../src/services/firebase");
      const userRef = doc(db, "Users", auth.currentUser!.uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const pairings = userData.pairings || [];
        const pairingIndex = pairings.findIndex((p: any) => p.id === data.id);
        
        if (pairingIndex !== -1) {
          const localPairing = pairings[pairingIndex];
          if (localPairing.participants) {
            localPairing.participants = localPairing.participants.filter(
              (p: any) => !selectedIds.has(p.id)
            );
            
            // Also reset assigned numbers if wanted, or let it stay locked
            pairings[pairingIndex] = localPairing;
            await updateDoc(userRef, { pairings });
            toast.success("Selected participants removed");
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove participants");
    } finally {
      setIsDeleting(null);
      setSelectedIds(new Set());
    }
  };

  const handleExportCSV = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Name,Email,Position\n";

      data.participants.forEach((p) => {
        const posText = p.assignedNumber ? `Position #${p.assignedNumber}` : "Available";
        csvContent += `"${p.name}","${p.email || ""}","${posText}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${data.title.replace(/\s+/g, "_")}_positions.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV file exported successfully!");
    } catch {
      toast.error("Failed to export CSV.");
    }
  };

  const getAvatarColor = (name: string, index: number) => {
    const gradients = [
      "from-pink-500 to-rose-500",
      "from-purple-500 to-indigo-500",
      "from-blue-500 to-cyan-500",
      "from-teal-500 to-emerald-500",
      "from-yellow-500 to-orange-500",
      "from-fuchsia-500 to-pink-500",
    ];
    const gradient = gradients[index % gradients.length];
    const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
    return (
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold font-mono shadow-sm flex-shrink-0`}>
        {initial}
      </div>
    );
  };

  // Filter participants
  const filteredParticipants = data.participants.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPages = Math.ceil(filteredParticipants.length / pageSize) || 1;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = new Set(paginatedParticipants.map((p) => p.id));
      setSelectedIds(ids);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
        {/* Card 1: Total Positions */}
        <div className="bg-[#E0F2FE] text-[#0369A1] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#BAE6FD]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7]/80 mb-1">
            Total Positions
          </span>
          <span className="text-3xl font-extrabold font-heading">
            {totalPositions}
          </span>
          <span className="text-[10px] font-semibold text-[#0284C7]/70 mt-0.5">
            Randomly assigned
          </span>
        </div>

        {/* Card 2: Filled */}
        <div className="bg-[#E0E7FF] text-[#3730A3] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#C7D2FE]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5]/80 mb-1">
            Filled
          </span>
          <span className="text-3xl font-extrabold font-heading">
            {filledCount}
          </span>
          <span className="text-[10px] font-semibold text-[#4F46E5]/70 mt-0.5">
            {capacityPct}% capacity
          </span>
        </div>

        {/* Card 3: Available */}
        <div className="bg-[#FEF3C7] text-[#B45309] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#FDE68A]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D97706]/80 mb-1">
            Available
          </span>
          <span className="text-3xl font-extrabold font-heading">
            {availableSlots}
          </span>
          <span className="text-[10px] font-semibold text-[#D97706]/70 mt-0.5">
            Open slots
          </span>
        </div>

        {/* Card 4: Participants */}
        <div className="bg-[#FCE7F3] text-[#BE185D] rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border border-[#FBCFE8]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#DB2777]/80 mb-1">
            Participants
          </span>
          <span className="text-3xl font-extrabold font-heading">
            {totalParticipants}
          </span>
          <span className="text-[10px] font-semibold text-[#DB2777]/70 mt-0.5">
            Checked in
          </span>
        </div>
      </div>

      {/* Grid of Position Cards */}
      <div className="text-left">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 font-heading">
          Participants
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {Array.from({ length: totalPositions }).map((_, idx) => {
            const positionNumber = idx + 1;
            // Find participant assigned to this number
            const participant = data.participants.find(
              (p) => p.assignedNumber === positionNumber
            );

            if (participant) {
              return (
                <div
                  key={participant.id}
                  className="bg-white rounded-3xl border border-gray-150/45 p-5 shadow-sm flex items-center justify-between gap-4 transition-all hover:shadow duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getAvatarColor(participant.name, idx)}
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-gray-400 tracking-wider">
                        Position #{positionNumber}
                      </p>
                      <h5 className="text-sm font-bold text-gray-900 mt-0.5 truncate capitalize font-heading">
                        {participant.name}
                      </h5>
                      {participant.email && (
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono">
                          {participant.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Circle check status icon */}
                  <div className="w-5 h-5 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 flex-shrink-0">
                    ✓
                  </div>
                </div>
              );
            } else {
              return (
                <div
                  key={`empty-${positionNumber}`}
                  className="bg-white/40 rounded-3xl border border-dashed border-gray-250 p-5 flex items-center gap-4 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300 text-xs font-bold font-mono">
                    {positionNumber}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 tracking-wider">
                      Position #{positionNumber}
                    </p>
                    <h5 className="text-sm font-bold text-gray-400 mt-0.5 font-heading">
                      Empty slot
                    </h5>
                    <p className="text-[10px] text-gray-300 font-medium mt-0.5">
                      Available
                    </p>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>

      {/* Bulk / checked in table */}
      <div className="flex flex-col gap-4 text-left border-t border-gray-100 pt-8">
        <h3 className="text-2xl font-bold text-gray-900 font-heading">
          All Participants
        </h3>

        <div className="bg-white rounded-[2rem] border border-gray-150/40 shadow-sm overflow-hidden flex flex-col">
          {/* Card Header Control Bar */}
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-gray-900">
                Participants List
              </h4>
              <p className="text-xs text-gray-400">
                View and manage all participants
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Box */}
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

              {/* Shuffle / Reassign All Button */}
              {totalParticipants > 0 && (
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl px-5 py-2.5 shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
                >
                  <FaRandom className="w-3 h-3 text-gray-500" />
                  Reassign all
                </button>
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

          {/* Bulk Select Delete Banner */}
          {selectedIds.size > 0 && (
            <div className="bg-blue-50/50 border-b border-blue-100/50 px-6 py-3 flex items-center justify-between transition-all">
              <span className="text-xs font-bold text-blue-700">
                {selectedIds.size} participant{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <button
                type="button"
                disabled={isDeleting !== null}
                onClick={handleBulkDelete}
                className="bg-red-650 hover:bg-red-700 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer disabled:bg-red-400"
              >
                <FaTrashAlt className="w-3 h-3" />
                Remove Selected
              </button>
            </div>
          )}

          {/* Table Container */}
          {totalParticipants === 0 ? (
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
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-6 w-12 text-center">
                      <input
                        type="checkbox"
                        checked={
                          paginatedParticipants.length > 0 &&
                          paginatedParticipants.every((p) => selectedIds.has(p.id))
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-6 font-bold">Name</th>
                    <th className="py-3 px-6 font-bold">Email</th>
                    <th className="py-3 px-6 font-bold">Position</th>
                    <th className="py-3 px-6 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {paginatedParticipants.map((p, idx) => {
                    const isRowSelected = selectedIds.has(p.id);
                    const positionText = p.assignedNumber ? `Position #${p.assignedNumber}` : "Unassigned";

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-50/40 transition-colors ${
                          isRowSelected ? "bg-blue-50/10" : ""
                        }`}
                      >
                        <td className="py-4 px-6 text-center">
                          <input
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={(e) => handleSelectRow(p.id, e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {getAvatarColor(p.name, idx)}
                            <span className="font-bold text-gray-900 capitalize font-heading">
                              {p.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-gray-500">
                          {p.email || "-"}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                            p.assignedNumber
                              ? "bg-purple-50 text-[#8338EC] border-purple-100"
                              : "bg-gray-100 text-gray-500 border-gray-200"
                          }`}>
                            {positionText}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            disabled={isDeleting === p.id}
                            onClick={() => handleRemove(p.id, p.name)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-bold border border-red-100 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            {isDeleting === p.id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Entries count selection */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Show</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="border border-gray-200 rounded-lg px-2 py-1 bg-white outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                    <span>entries</span>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                      className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <FaChevronLeft className="w-3 h-3 text-gray-600" />
                    </button>
                    <span className="text-xs font-bold text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                      className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-white flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <FaChevronRight className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RandomPositioningResult;
