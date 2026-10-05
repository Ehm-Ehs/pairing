import { eventKindLabel } from "./eventStats";
import { errorMessage } from "@/utils/errors";
import { formatRelativeLong } from "./timeUtils";
import { confirmToast, runWithToast } from "@/components/ui/confirmToast";
import { logger } from "@/utils/logger";
import { auth } from "../services/firebase";
import { useState, useRef, useEffect } from "react";
import { FaClock, FaUsers, FaEllipsisH, FaCopy, FaClone, FaLock, FaTrashAlt, FaCheck } from "react-icons/fa";
import { Pairing } from "../types";
import { getEventStats, copyJoinLink } from "../../app/home/_components/homeUtils";
import { deletePairingEvent, duplicatePairingEvent, closePairingEvent } from "../services/endpoints";
import { toast } from "react-toastify";
import { capitalizeWords } from "./stringUtils";

interface EventCardProps {
  event: Pairing;
  index: number;
  onViewDetails: (index: number) => void;
}

const EventCard = ({
  event,
  index,
  onViewDetails,
}: EventCardProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const stats = getEventStats(event);

  const userId = auth.currentUser?.uid || "";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCopying(true);
    try {
      await copyJoinLink(event);
      setIsCopied(true);
    } catch (err) {
      logger.error("Copy error:", err);
    } finally {
      setIsCopying(false);
    }
    setTimeout(() => {
      setIsCopied(false);
      setShowMenu(false);
    }, 1500);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (!userId) return;
    try {
      await duplicatePairingEvent(userId, event.id);
      toast.success("Event duplicated successfully!");
    } catch (err) {
      logger.error("Duplicate error:", err);
      let friendlyMsg = "Something went wrong while duplicating the event. Please try again.";
      if (errorMessage(err)?.includes("undefined")) {
        friendlyMsg = "Unable to duplicate: One of the fields in this event contains undefined data, which is unsupported by the database.";
      }
      toast.error(friendlyMsg);
    }
  };

  const handleCloseEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (!userId) return;
    confirmToast({
      title: "Close Event?",
      message: "Are you sure you want to close this event? No further registrations will be allowed.",
      confirmLabel: "Close Event",
      onConfirm: () =>
        runWithToast(() => closePairingEvent(userId, event.id), "Event closed successfully!", "Failed to close event"),
    });
  };

  const handleDeleteEvent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    if (!userId) return;
    confirmToast({
      title: "Delete Event?",
      message: "Are you sure you want to delete this event? This action is permanent.",
      confirmLabel: "Delete Event",
      onConfirm: () =>
        runWithToast(() => deletePairingEvent(userId, event.id), "Event deleted successfully!", "Failed to delete event"),
    });
  };


  // Determine banner decoration
  const renderBanner = () => {
    if (event.imageUrl) {
      return (
        <img
          src={event.imageUrl}
          alt={event.groupingPurpose}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      );
    }
    const titleLower = (event.groupingPurpose || "").toLowerCase();
    if (titleLower.includes("wedding") || titleLower.includes("marry") || titleLower.includes("marriage")) {
      return (
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80"
          alt={event.groupingPurpose}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      );
    }
    if (event.type === "secret-santa") {
      return (
        <img
          src="https://images.unsplash.com/photo-1544982503-9f984c14501a?auto=format&fit=crop&w=400&q=80"
          alt={event.groupingPurpose}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      );
    }
    // Default gradient card with title overlay
    return (
      <div className="w-full h-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex flex-col justify-center items-center text-white p-6 text-center relative overflow-hidden">
        {/* Decor circle */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <span className="font-extrabold text-2xl font-heading leading-tight tracking-tight drop-shadow-sm truncate max-w-full">
          {capitalizeWords(event.groupingPurpose)}
        </span>
        <span className="text-[10px] uppercase font-bold text-white/70 tracking-wider mt-1 block">
          Pairings Dashboard
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150/40 p-4 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group relative">
      <div>
        {/* Banner cover */}
        <div className="h-40 w-full overflow-hidden rounded-2xl relative mb-4 bg-gray-50 border border-gray-100 flex-shrink-0">
          {renderBanner()}
        </div>

        {/* Title and Live status badge */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className="text-base font-bold text-gray-900 font-heading leading-tight capitalize truncate">
            {capitalizeWords(event.groupingPurpose)}
          </h4>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 border flex-shrink-0 select-none ${
            event.status !== "locked"
              ? "bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]"
              : "bg-gray-100 text-gray-400 border-gray-250"
          }`}>
            <span className={`w-1 h-1 rounded-full ${
              event.status !== "locked" ? "bg-[#2563EB] animate-pulse" : "bg-gray-300"
            }`} />
            {event.status !== "locked" ? "Live" : "Closed"}
          </span>
        </div>

        {/* Info Indicators */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-semibold mb-4">
          <span className="flex items-center gap-1">
            <FaUsers className="w-3 h-3 text-gray-350" />
            {stats.filledSlots}/{stats.totalSlots}
          </span>
          <span className="flex items-center gap-1">
            <FaClock className="w-3 h-3 text-gray-350" />
            {formatRelativeLong(event.createdAt)}
          </span>
          <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">
            {eventKindLabel(event)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.fillPercentage}%` }}
            />
          </div>
          <span className="text-[10px] font-extrabold text-gray-500 text-right w-8 flex-shrink-0">
            {stats.fillPercentage}%
          </span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="flex items-center gap-2 mt-auto w-full relative">
        <button
          onClick={() => onViewDetails(index)}
          className="border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-full py-2 flex-grow text-center text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          View details
        </button>

        {/* Ellipsis actions menu trigger */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="border border-gray-250 bg-white hover:bg-gray-50 text-gray-400 hover:text-gray-700 p-2.5 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-sm"
          >
            <FaEllipsisH className="w-3 h-3" />
          </button>

          {/* Context menu popup */}
          {showMenu && (
            <div className="absolute right-0 bottom-full mb-2 w-36 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150 text-left">
              <button
                onClick={handleCopyLink}
                disabled={isCopying}
                className="w-full text-left px-3.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-bold disabled:opacity-75"
              >
                {isCopying ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <span>Copying</span>
                    <span className="inline-flex items-center gap-0.5 ml-0.5">
                      <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" />
                    </span>
                  </span>
                ) : isCopied ? (
                  <>
                    <FaCheck className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <FaCopy className="w-3 h-3 text-gray-400" />
                    Copy link
                  </>
                )}
              </button>
              <button
                onClick={handleDuplicate}
                className="w-full text-left px-3.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-bold"
              >
                <FaClone className="w-3 h-3 text-gray-400" />
                Duplicate
              </button>
              {event.status !== "locked" && (
                <button
                  onClick={handleCloseEvent}
                  className="w-full text-left px-3.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-bold"
                >
                  <FaLock className="w-3 h-3 text-gray-400" />
                  Close
                </button>
              )}
              <button
                onClick={handleDeleteEvent}
                className="w-full text-left px-3.5 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold border-t border-gray-50 mt-1 pt-1.5"
              >
                <FaTrashAlt className="w-3 h-3 text-red-400" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
