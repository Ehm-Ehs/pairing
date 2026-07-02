import { useState, useEffect } from "react";
import { Button } from "../../../src/components/ui/button";
import { Card, CardContent } from "../../../src/components/ui/card";
import { FaPlus, FaSearch, FaChevronLeft, FaChevronRight, FaLayerGroup } from "react-icons/fa";
import { GroupingsPageProps } from "../../../src/types";
import DashboardStats from "./DashboardStats";
import EventCard from "../../../src/utils/EventCard";
import { useHomeActions } from "../../../src/hooks/useHomeActions";
import { useSearchParams, useRouter } from "next/navigation";

interface HomeProps {
  data: GroupingsPageProps | null;
}

export default function Home({ data }: HomeProps) {
  const router = useRouter();
  const allEvents = data?.pairings || [];
  const organizerName = data?.firstName || "Organizer";
  const {
    handleCreateNew,
    handleGeneratePairs,
    handleShare,
  } = useHomeActions();

  // Filters State
  const [statusFilter, setStatusFilter] = useState<"all" | "live" | "closed">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "role-based" | "secret-santa" | "random-positioning">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, typeFilter, searchQuery, pageSize]);

  // Calculate overall stats (All-time pairings)
  const totalEventsCount = allEvents.length;
  const liveEventsCount = allEvents.filter((e) => e.status !== "locked").length;

  let totalParticipantsCount = 0;
  allEvents.forEach((event) => {
    if (event.type === "secret-santa" || event.type === "random-positioning") {
      totalParticipantsCount += event.participants?.length || 0;
    } else {
      Object.values(event.groups || {}).forEach((group: any) => {
        totalParticipantsCount += group.filter((p: any) => p.name).length;
      });
    }
  });

  // Filter events list
  const filteredEvents = allEvents.filter((event) => {
    // Status Filter
    if (statusFilter === "live" && event.status === "locked") return false;
    if (statusFilter === "closed" && event.status !== "locked") return false;

    // Type Filter
    if (typeFilter !== "all" && event.type !== typeFilter) return false;

    // Search Query
    if (searchQuery.trim() !== "") {
      const matchText = (event.groupingPurpose || "").toLowerCase();
      if (!matchText.includes(searchQuery.toLowerCase())) return false;
    }

    return true;
  });

  // Paginated events
  const totalFilteredCount = filteredEvents.length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const startEntryIndex = totalFilteredCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endEntryIndex = Math.min(currentPage * pageSize, totalFilteredCount);

  if (totalEventsCount === 0) {
    // Empty state welcome screen
    return (
      <div className="py-8 max-w-5xl mx-auto px-4 text-center">
        {/* Welcome Empty view Card */}
        <div className="bg-white rounded-[2.5rem] p-8 md:p-16 shadow-sm border border-gray-150/40 w-full flex flex-col items-center">
          <div className="w-16 h-16 bg-[#3A76F0]/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-[#3A76F0]/5">
            <FaLayerGroup className="w-8 h-8 text-[#3A76F0]" />
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-heading tracking-tight">
            Welcome to PairForm
          </h2>
          <p className="text-sm text-gray-500 mb-12 max-w-md">
            Create fair, role-balanced groups in real-time without spreadsheets or stress
          </p>

          {/* Core steps widgets */}
          <div className="border border-gray-200/60 rounded-[2.5rem] p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12 bg-white/30 backdrop-blur-sm">
            {/* Step 1 */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center shadow-sm">
              <div className="w-10 h-10 bg-[#3A76F0] text-white rounded-2xl flex items-center justify-center font-bold text-sm mb-4 shadow-lg shadow-blue-500/30">
                1
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-1">
                Define Structure
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Set number of groups and roles per group in seconds
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center shadow-sm">
              <div className="w-10 h-10 bg-[#4F46E5] text-white rounded-2xl flex items-center justify-center font-bold text-sm mb-4 shadow-lg shadow-indigo-500/30">
                2
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-1">
                Share Link
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Participants join instantly without creating accounts
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center shadow-sm">
              <div className="w-10 h-10 bg-[#D946EF] text-white rounded-2xl flex items-center justify-center font-bold text-sm mb-4 shadow-lg shadow-fuchsia-500/30">
                3
              </div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-1">
                Watch Live
              </h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Monitor real-time group formation as people join
              </p>
            </div>
          </div>

          {/* Action trigger */}
          <button
            onClick={handleCreateNew}
            className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:from-[#4280FF] hover:to-[#023194] text-white rounded-full px-8 py-3.5 font-bold text-sm shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-95 cursor-pointer focus:outline-none"
          >
            Create your first event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4">
      {/* Stats Cards Dashboard */}
      <DashboardStats
        totalEvents={totalEventsCount}
        liveEvents={liveEventsCount}
        totalParticipants={totalParticipantsCount}
      />

      {/* Filters row & actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-6 text-left">
        {/* Left Status tab capsules */}
        <div className="bg-gray-100/80 p-1 rounded-full border border-gray-200/50 flex w-fit">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${statusFilter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
          >
            All Events
          </button>
          <button
            onClick={() => setStatusFilter("live")}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${statusFilter === "live" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
          >
            Live
          </button>
          <button
            onClick={() => setStatusFilter("closed")}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 ${statusFilter === "closed" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
          >
            Closed
          </button>
        </div>

        {/* Right Search and Type controls */}
        <div className="flex items-center gap-2">
          {/* Dropdown Filter by Type */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-white border border-gray-200 rounded-full px-4 py-2 text-xs font-bold text-gray-600 outline-none cursor-pointer appearance-none pr-8 select-none"
            >
              <option value="all">All Types</option>
              <option value="role-based">Group Pairs</option>
              <option value="secret-santa">Secret Santa</option>
              <option value="random-positioning">Random Positioning</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center bg-white border border-gray-200 rounded-full px-3.5 py-2 w-full sm:w-64 shadow-sm">
            <FaSearch className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search Event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-0 outline-none text-xs w-full placeholder-gray-400 text-gray-700 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Events Grid layout */}
      {paginatedEvents.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-150/40 p-6">
          <p className="text-sm font-bold text-gray-400">No events found matching your filter criteria</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 text-left">
          {paginatedEvents.map((event, index) => {
            // Find absolute index in allEvents array to preserve share details callbacks
            const originalIndex = allEvents.findIndex((e) => e.id === event.id);

            return (
              <EventCard
                key={event.id}
                event={event}
                index={originalIndex !== -1 ? originalIndex : index}
                onGeneratePairs={handleGeneratePairs}
                onViewDetails={handleShare}
              />
            );
          })}
        </div>
      )}

      {/* Pagination row */}
      {totalFilteredCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
          <span className="text-xs font-semibold text-gray-400">
            Show {startEntryIndex}-{endEntryIndex} of {totalFilteredCount} entries
          </span>

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
        </div>
      )}
    </div>
  );
}
