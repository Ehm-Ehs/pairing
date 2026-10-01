"use client";
import React, { useState } from "react";
import { FaSearch, FaTrashAlt, FaUsers } from "react-icons/fa";
import { RoleBasedPairing } from "../../../src/types";
import { usePagination } from "../../../src/hooks/usePagination";
import { useBulkSelection } from "../../../src/hooks/useBulkSelection";
import { useRoleBasedActions } from "../../../src/hooks/useRoleBasedActions";
import { PaginationBar } from "../../../src/components/ui/PaginationBar";
import { EmptyState } from "../../../src/components/ui/EmptyState";
import { ParticipantTable } from "../../../src/components/ui/ParticipantTable";
import RoleGrid, { getRoleBadgeStyle } from "./RoleGrid";
import { capitalizeWords, formatGroupName } from "../../../src/utils/stringUtils";
import { toast } from "react-toastify";

interface RoleBasedListProps {
  pairing: RoleBasedPairing;
  isPublicView?: boolean;
}

const RoleBasedList: React.FC<RoleBasedListProps> = ({ pairing, isPublicView = false }) => {
  const [activeTab, setActiveTab] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  let userId = "";
  try {
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (userStr && userStr !== "null") {
      const parsed = JSON.parse(userStr);
      userId = parsed.uid || "";
    }
  } catch {
    // ignored
  }

  let unblurredGroupKey: string | null = null;
  if (typeof window !== "undefined") {
    const searchParams = new URLSearchParams(window.location.search);
    unblurredGroupKey = searchParams.get("group");
  }

  const filledParticipants: {
    id: string;
    number: number;
    role: string;
    name: string;
    email: string;
    groupKey: string;
    groupNum: string | number;
  }[] = [];

  Object.entries(pairing.groups || {}).forEach(([groupKey, group]) => {
    const groupNum = formatGroupName(groupKey);
    group.forEach((member) => {
      if (member.name && member.name.trim() !== "") {
        filledParticipants.push({
          ...member,
          name: member.name,
          email: member.email || "",
          groupKey,
          groupNum,
        });
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

  const handleBulkImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      const { parseParticipantsCsv } = await import("../../../src/utils/csvImport");
      const { editPairingValue } = await import("../../../src/services/endpoints");
      const parsed = await parseParticipantsCsv(file);
      if (parsed.length === 0) {
        toast.error("No valid participants found in CSV file.");
        return;
      }

      let count = 0;
      const groupsObj = pairing.groups as Record<string, any[]>;
      const groupKeys = Object.keys(groupsObj);
      for (const p of parsed) {
        if (!p.name && !p.email) continue;
        let filled = false;

        for (const groupKey of groupKeys) {
          const group = groupsObj[groupKey];
          const emptySlotIndex = group.findIndex((slot: any) => !slot.name || slot.name.trim() === "");
          if (emptySlotIndex !== -1) {
            const slot = group[emptySlotIndex];
            await editPairingValue(
              userId,
              pairing.groupingPurpose,
              groupKey,
              emptySlotIndex,
              slot.id,
              {
                name: p.name || (p.email ? p.email.split("@")[0] : "Participant"),
                email: p.email || "",
                track: p.role || slot.role || "",
              }
            );
            count++;
            filled = true;
            break;
          }
        }
        if (!filled) break;
      }

      if (count > 0) {
        toast.success(`Successfully imported ${count} participants from CSV!`);
      } else {
        toast.info("All group slots are already filled or no empty slots available.");
      }
    } catch (err: any) {
      console.error("CSV import error:", err);
      toast.error("Failed to import CSV: " + err.message);
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-Header & Tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 font-heading">
            {activeTab === "grid" ? "Group Breakdown" : "Registered Participants"}
          </h3>
          <p className="text-xs text-gray-400 font-medium">
            {activeTab === "grid"
              ? "View roles and member allocations per group"
              : "Search, filter, and manage all joined participants"}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-2xl self-start sm:self-auto border border-gray-200/60 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("grid")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "grid"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
            Group View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <FaUsers className="w-3.5 h-3.5" />
            List View ({filledParticipants.length})
          </button>
        </div>
      </div>

      {activeTab === "grid" ? (
        <RoleGrid
          pairing={pairing}
          isDeleting={isDeleting}
          handleClearSlot={handleClearSlot}
          isPublicView={isPublicView}
          unblurredGroupKey={unblurredGroupKey}
        />
      ) : (
        <div className="bg-white rounded-[2rem] border border-gray-150/40 shadow-sm overflow-hidden flex flex-col">
          {/* List Search & Controls Header */}
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-3.5 py-2 w-full sm:w-72 shadow-sm">
              <FaSearch className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search name, email, or role..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="bg-transparent border-0 outline-none text-xs w-full placeholder-gray-400 text-gray-700 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Import CSV Button */}
              {!isPublicView && pairing.status !== "locked" && (
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

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportParticipantsCSV}
                className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:opacity-95 text-white text-xs font-bold rounded-xl px-4 py-2.5 flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Bulk delete bar */}
          {!isPublicView && selectedIds.size > 0 && (
            <div className="bg-blue-50/50 border-b border-blue-100/50 px-6 py-3 flex items-center justify-between animate-in fade-in duration-150">
              <span className="text-xs font-bold text-blue-700">
                {selectedIds.size} participant(s) selected
              </span>
              <button
                type="button"
                disabled={isDeleting !== null}
                onClick={handleBulkClearSlots}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <FaTrashAlt className="w-3 h-3" /> Remove Selected
              </button>
            </div>
          )}

          {/* Table / Empty states */}
          {filledParticipants.length === 0 ? (
            <EmptyState message="No participants have registered yet. Share the event link to get started!" />
          ) : filteredParticipants.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 font-semibold">
              No participants match &quot;{searchTerm}&quot;
            </div>
          ) : (
            <ParticipantTable
              headers={["Name", "Email", "Role", "Group", "Action"]}
              enableBulkSelection={!isPublicView}
              isAllPageSelected={isAllPageSelected(paginatedParticipants)}
              onSelectAllToggle={() => handleSelectAllToggle(paginatedParticipants)}
              selectedIds={Array.from(selectedIds)}
              onSelectOneToggle={handleSelectRow}
              rows={paginatedParticipants.map((p) => ({
                id: `${p.groupKey}_${p.id}`,
                cells: [
                  <span key="name" className="font-bold text-gray-900 font-heading capitalize">
                    {p.name}
                  </span>,
                  <span key="email" className="text-gray-500 font-mono">
                    {p.email || "-"}
                  </span>,
                  <span
                    key="role"
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${getRoleBadgeStyle(
                      p.role
                    )}`}
                  >
                    {capitalizeWords(p.role)}
                  </span>,
                  <span key="group" className="font-bold text-blue-600">
                    Group {p.groupNum}
                  </span>,
                  !isPublicView && pairing.status !== "locked" ? (
                    <button
                      key="action"
                      type="button"
                      disabled={isDeleting === p.id}
                      onClick={() => handleClearSlot(p.groupKey, p as any)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isDeleting === p.id ? "Clearing..." : "Clear Slot"}
                    </button>
                  ) : (
                    <span key="action" className="text-gray-300">-</span>
                  ),
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
      )}
    </div>
  );
};

export default RoleBasedList;
