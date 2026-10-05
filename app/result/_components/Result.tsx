import { formatEventDate, formatRelativeLong } from "@/utils/timeUtils";
import { countSlots, eventKindLabel, eventPeople } from "@/utils/eventStats";
import { downloadCsv, fileStem } from "@/utils/csv";
import { copyToClipboard } from "@/utils/clipboard";
import { absoluteUrl, joinPath } from "@/utils/eventLinks";
import { confirmToast, runWithToast } from "@/components/ui/confirmToast";
import { logger } from "@/utils/logger";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { GroupingsPageProps, Pairing } from "@/types";
import EventStats from "./EventStats";

const SecretSantaList = dynamic(() => import("./SecretSantaList"), {
  loading: () => <div className="text-gray-400 animate-pulse py-8 text-center text-xs font-semibold">Loading Secret Santa List...</div>,
  ssr: false,
});

const RoleBasedList = dynamic(() => import("./RoleBasedList"), {
  loading: () => <div className="text-gray-400 animate-pulse py-8 text-center text-xs font-semibold">Loading Group Pairs List...</div>,
  ssr: false,
});

const RandomPositioningResult = dynamic(() => import("./RandomPositioningResult"), {
  loading: () => <div className="text-gray-400 animate-pulse py-8 text-center text-xs font-semibold">Loading Positions List...</div>,
  ssr: false,
});

const SpeedNetworkingMatrix = dynamic(() => import("@/components/events/SpeedNetworkingMatrix"), {
  loading: () => <div className="text-gray-400 animate-pulse py-8 text-center text-xs font-semibold">Loading Speed Networking Matrix...</div>,
  ssr: false,
});
import { closePairingEvent, updatePairingVisibility } from "@/services/endpoints";
import { auth } from "@/services/firebase";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { formatGroupName } from "@/utils/stringUtils";
import { FaLock, FaGlobe } from "react-icons/fa";


const capitalizeWords = (str: string) => {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

interface ResultProps {
  data: GroupingsPageProps | null;
  isPublicView?: boolean;
}

import { useWorkspace } from "@/context/WorkspaceContext";

const Result = ({ data, isPublicView = false }: ResultProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeWorkspace } = useWorkspace();
  const [isClosing, setIsClosing] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const [copiedLinkLocal, setCopiedLinkLocal] = useState(false);

  // Get index or ID from query params
  const indexParam = searchParams.get("index");
  const idParam = searchParams.get("id");

  let selectedIndex = isPublicView ? 0 : (indexParam ? parseInt(indexParam) : null);

  if (selectedIndex === null && idParam && data && data.pairings && data.pairings.length > 0) {
    const foundIndex = data.pairings.findIndex((p) => p.id === idParam);
    if (foundIndex !== -1) {
      selectedIndex = foundIndex;
    } else {
      selectedIndex = 0;
    }
  }

  const userId = data?.userId || data?.uid || auth.currentUser?.uid || "";

  const [directPairing, setDirectPairing] = useState<Pairing | null>(null);
  const [fetchingDirect, setFetchingDirect] = useState(false);
  const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

  // Organizer view: keep the selected event live so joins, removals and draws show up immediately.
  useEffect(() => {
    if (isPublicView || !idParam) return;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    setFetchingDirect(true);

    (async () => {
      try {
        const { doc, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("@/services/firebase");
        if (cancelled) return;
        unsubscribe = onSnapshot(
          doc(db, "Pairings", idParam),
          (snap) => {
            setDirectPairing(snap.exists() ? (snap.data() as Pairing) : null);
            setFetchingDirect(false);
            setHasAttemptedFetch(true);
          },
          (err) => {
            logger.error("Direct pairing fetch error:", err);
            setFetchingDirect(false);
            setHasAttemptedFetch(true);
          }
        );
      } catch (err) {
        logger.error("Direct pairing fetch error:", err);
        setFetchingDirect(false);
        setHasAttemptedFetch(true);
      }
    })();

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, [idParam, isPublicView]);

  // Organization workspaces: events selected by index come from the workspace list.
  useEffect(() => {
    if (isPublicView || idParam || indexParam === null || !userId || !activeWorkspace) return;
    let cancelled = false;
    (async () => {
      const { fetchWorkspacePairings } = await import("@/services/endpoints");
      const workspaceEvents = await fetchWorkspacePairings(activeWorkspace, userId);
      const pIdx = parseInt(indexParam);
      if (!cancelled && !isNaN(pIdx) && workspaceEvents[pIdx]) setDirectPairing(workspaceEvents[pIdx]);
      if (!cancelled) setHasAttemptedFetch(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [idParam, indexParam, isPublicView, userId, activeWorkspace]);

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500 font-semibold">
        No data available
      </div>
    );
  }

  if ((idParam || indexParam) && !directPairing && fetchingDirect) {
    return (
      <div className="p-8 text-center text-gray-500 font-semibold animate-pulse">
        Loading event details...
      </div>
    );
  }

  const pairingsToRender = directPairing
    ? [directPairing]
    : selectedIndex !== null && data.pairings && data.pairings[selectedIndex]
    ? [data.pairings[selectedIndex]]
    : (data.pairings && data.pairings.length > 0)
    ? data.pairings
    : [];

  if (pairingsToRender.length === 0 && (hasAttemptedFetch || selectedIndex === null || !data.pairings?.length)) {
    return (
      <div className="py-16 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 font-heading">Event Not Found</h3>
        <p className="text-xs text-gray-500 mb-6 font-medium">The requested event could not be found or may have been deleted.</p>
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] text-white text-xs font-bold px-6 py-2.5 rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
        >
          Back to My Events
        </button>
      </div>
    );
  }

  const handleCloseEventClick = (eventId: string) =>
    confirmToast({
      title: "Close Event?",
      message: "Are you sure you want to close this event? No further registrations will be allowed.",
      confirmLabel: "Close Event",
      onConfirm: async () => {
        setIsClosing(true);
        await runWithToast(() => closePairingEvent(userId, eventId), "Event closed successfully!", "Failed to close event");
        setIsClosing(false);
      },
    });

  return (
    <div className="bg-[#f8f9fa] min-h-screen py-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {pairingsToRender.map((pairing, index) => {

          const { totalSlots, filledSlots, fillPercentage } = countSlots(pairing);

          const formUrl = absoluteUrl(joinPath(pairing, userId));

          const handleCopyFormLink = async () => {
            if (await copyToClipboard(formUrl)) {
              setCopiedLinkLocal(true);
              setTimeout(() => setCopiedLinkLocal(false), 3000);
            }
          };

          const handleExportCSV = () => {
            if (pairing.type !== "role-based") return;
            const rows = Object.entries(pairing.groups || {}).flatMap(([groupKey, group]) =>
              (Array.isArray(group) ? group : []).map((member) => [
                formatGroupName(groupKey),
                member.number,
                member.role,
                member.name || "Available Slot",
                member.email,
              ])
            );
            downloadCsv(`${fileStem(pairing.groupingPurpose)}_pairings.csv`, ["Group", "Slot Number", "Role", "Name", "Email"], rows);
          };

          const handleShareClick = async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: pairing.groupingPurpose,
                  text: `Join the pairing event: ${pairing.groupingPurpose}`,
                  url: formUrl,
                });
              } catch (err) {
                logger.debug("Error sharing:", err);
              }
            } else {
              handleCopyFormLink();
            }
          };

          return (
            <div key={index} className="flex flex-col gap-6">
              {/* Back navigation and Close event row */}
              {!isPublicView ? (
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => router.push("/home")}
                    className="flex items-center gap-2 text-gray-550 hover:text-gray-900 transition-colors text-sm font-semibold cursor-pointer group"
                  >
                    <svg width="29" height="29" viewBox="0 0 28.3333 28.3333" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fill-rule="evenodd" clip-rule="evenodd" d="M10.2978 13.0333L12.2924 15.028L11.0897 16.2308L8.28467 13.4258L7.58483 12.7245C7.45204 12.5917 7.37744 12.4115 7.37744 12.2237C7.37744 12.0359 7.45204 11.8557 7.58483 11.7229L11.0897 8.21667L12.2924 9.41942L10.3771 11.3333H17C18.1272 11.3333 19.2082 11.7811 20.0052 12.5781C20.8022 13.3752 21.25 14.4562 21.25 15.5833C21.25 16.7105 20.8022 17.7915 20.0052 18.5885C19.2082 19.3856 18.1272 19.8333 17 19.8333H14.1667V18.1333H17C17.6763 18.1333 18.3249 17.8647 18.8031 17.3865C19.2813 16.9082 19.55 16.2596 19.55 15.5833C19.55 14.907 19.2813 14.2584 18.8031 13.7802C18.3249 13.302 17.6763 13.0333 17 13.0333H10.2978ZM14.1667 28.3333C6.34242 28.3333 0 21.9909 0 14.1667C0 6.34242 6.34242 0 14.1667 0C21.9909 0 28.3333 6.34242 28.3333 14.1667C28.3333 21.9909 21.9909 28.3333 14.1667 28.3333ZM14.1667 26.6333C17.473 26.6333 20.644 25.3199 22.9819 22.9819C25.3199 20.644 26.6333 17.473 26.6333 14.1667C26.6333 10.8603 25.3199 7.68936 22.9819 5.3514C20.644 3.01345 17.473 1.7 14.1667 1.7C10.8603 1.7 7.68936 3.01345 5.3514 5.3514C3.01345 7.68936 1.7 10.8603 1.7 14.1667C1.7 17.473 3.01345 20.644 5.3514 22.9819C7.68936 25.3199 10.8603 26.6333 14.1667 26.6333Z" fill="#242424" fill-opacity="0.9" />
                    </svg>
                    Back to My Events
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        const nextVis = pairing.visibilityMode === "restricted" ? "public" : "restricted";
                        setIsTogglingVisibility(true);
                        try {
                          await updatePairingVisibility(userId, pairing.id, nextVis);
                          toast.success(`Visibility set to ${nextVis === "restricted" ? "Restricted (Blurred)" : "Public (Show All)"}`);
                          if (typeof window !== "undefined") window.location.reload();
                        } catch {
                          toast.error("Failed to toggle visibility");
                        } finally {
                          setIsTogglingVisibility(false);
                        }
                      }}
                      disabled={isTogglingVisibility}
                      className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                        pairing.visibilityMode === "restricted"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                      }`}
                      title="Toggle whether participants see all groups or only their own"
                    >
                      {pairing.visibilityMode === "restricted" ? (
                        <>
                          <FaLock className="w-3 h-3 text-amber-700" />
                          <span>Visibility: Restricted</span>
                        </>
                      ) : (
                        <>
                          <FaGlobe className="w-3 h-3 text-blue-600" />
                          <span>Visibility: Public</span>
                        </>
                      )}
                    </button>

                    {pairing.status !== "locked" ? (
                      <button
                        onClick={() => handleCloseEventClick(pairing.id)}
                        disabled={isClosing}
                        className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer disabled:bg-red-400 disabled:cursor-not-allowed"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="15" y1="9" x2="9" y2="15"></line>
                          <line x1="9" y1="9" x2="15" y2="15"></line>
                        </svg>
                        Close Event
                      </button>
                    ) : (
                      <span className="bg-gray-200 text-gray-500 px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-gray-300 select-none">
                        Event Closed
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div
                    onClick={() => router.push("/")}
                    className="flex items-center gap-2 text-gray-550 hover:text-gray-900 transition-colors text-sm font-semibold cursor-pointer group"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12"></line>
                      <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Home
                  </div>
                </div>
              )}

              {/* Blue Gradient Capsule Banner */}
              <div
                className="bg-gradient-to-r from-[#1E40AF] via-[#3B82F6] to-[#0284C7] text-white rounded-[2rem] p-6 md:p-8 flex flex-col gap-6 shadow-sm border border-blue-400/20 relative overflow-hidden"
                style={pairing.imageUrl ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(30, 64, 175, 0.45), rgba(2, 132, 199, 0.85)), url(${pairing.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                {/* Background decorative shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                {/* Event Name & Metadata Badges */}
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white capitalize" >
                      {capitalizeWords(pairing.groupingPurpose)}
                    </h2>
                    <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 shadow-sm border ${pairing.status !== "locked"
                      ? "bg-[#10B981]/25 text-[#34D399] border-[#10B981]/30"
                      : "bg-white/10 text-white/60 border-white/20"
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${pairing.status !== "locked" ? "bg-[#34D399] animate-pulse" : "bg-white/40"
                        }`} />
                      {pairing.status !== "locked" ? "Live" : "Closed"}
                    </span>
                    <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-white/15 text-white border border-white/20">
                      {eventKindLabel(pairing)}
                    </span>
                    {pairing.type === "random-positioning" && (
                      <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-white/15 text-white border border-white/20">
                        {pairing.hideNames ? "Names Hidden" : "Names Public"}
                      </span>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap gap-4 text-xs text-white/80">
                    <span className="flex items-center gap-1.5">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M4 2.018C3.46 2.041 3.072 2.092 2.729 2.208C2.14238 2.40442 1.60932 2.73422 1.17171 3.17148C0.734106 3.60874 0.403882 4.14154 0.207 4.728C1.49012e-08 5.349 0 6.115 0 7.649C0 7.744 1.11759e-08 7.792 0.013 7.83C0.0252768 7.86679 0.0459435 7.90021 0.0733657 7.92763C0.100788 7.95506 0.134214 7.97572 0.171 7.988C0.209 8.001 0.257 8.001 0.353 8.001H17.647C17.743 8.001 17.791 8.001 17.829 7.988C17.8658 7.97572 17.8992 7.95506 17.9266 7.92763C17.9541 7.90021 17.9747 7.86679 17.987 7.83C18 7.791 18 7.743 18 7.647C18 6.114 18 5.347 17.793 4.729C17.5964 4.14217 17.2663 3.60897 16.8287 3.17135C16.391 2.73372 15.8578 2.40362 15.271 2.207C14.928 2.092 14.539 2.041 14 2.018V4.5C14 4.89782 13.842 5.27936 13.5607 5.56066C13.2794 5.84196 12.8978 6 12.5 6C12.1022 6 11.7206 5.84196 11.4393 5.56066C11.158 5.27936 11 4.89782 11 4.5V2H7V4.5C7 4.89782 6.84196 5.27936 6.56066 5.56066C6.27936 5.84196 5.89782 6 5.5 6C5.10218 6 4.72064 5.84196 4.43934 5.56066C4.15804 5.27936 4 4.89782 4 4.5V2.018Z" fill="url(#paint0_linear_125_4832)" />
                        <path d="M0 9.5C0 9.264 -4.47035e-08 9.146 0.073 9.073C0.146 9 0.264 9 0.5 9H17.5C17.736 9 17.854 9 17.927 9.073C18 9.146 18 9.264 18 9.5V10C18 13.771 18 15.657 16.828 16.828C15.656 17.999 13.771 18 10 18H8C4.229 18 2.343 18 1.172 16.828C0.000999928 15.656 0 13.771 0 10V9.5Z" fill="white" />
                        <path d="M5.5 0.5V4.5M12.5 0.5V4.5" stroke="url(#paint1_linear_125_4832)" stroke-linecap="round" />
                        <defs>
                          <linearGradient id="paint0_linear_125_4832" x1="9" y1="2" x2="9" y2="8.001" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#3A76F0" />
                            <stop offset="1" stop-color="#012A7D" />
                          </linearGradient>
                          <linearGradient id="paint1_linear_125_4832" x1="9" y1="0.5" x2="9" y2="4.5" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#3A76F0" />
                            <stop offset="1" stop-color="#012A7D" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {formatEventDate(pairing.createdAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 0C15.523 0 20 4.477 20 10C20 15.523 15.523 20 10 20C4.477 20 0 15.523 0 10C0 4.477 4.477 0 10 0ZM10 2C7.87827 2 5.84344 2.84285 4.34314 4.34314C2.84285 5.84344 2 7.87827 2 10C2 12.1217 2.84285 14.1566 4.34314 15.6569C5.84344 17.1571 7.87827 18 10 18C12.1217 18 14.1566 17.1571 15.6569 15.6569C17.1571 14.1566 18 12.1217 18 10C18 7.87827 17.1571 5.84344 15.6569 4.34314C14.1566 2.84285 12.1217 2 10 2ZM10 4C10.2449 4.00003 10.4813 4.08996 10.6644 4.25271C10.8474 4.41547 10.9643 4.63975 10.993 4.883L11 5V9.586L13.707 12.293C13.8863 12.473 13.9905 12.7144 13.9982 12.9684C14.006 13.2223 13.9168 13.4697 13.7487 13.6603C13.5807 13.8508 13.3464 13.9703 13.0935 13.9944C12.8406 14.0185 12.588 13.9454 12.387 13.79L12.293 13.707L9.293 10.707C9.13758 10.5514 9.03776 10.349 9.009 10.131L9 10V5C9 4.73478 9.10536 4.48043 9.29289 4.29289C9.48043 4.10536 9.73478 4 10 4Z" fill="url(#paint0_linear_125_4839)" />
                        <defs>
                          <linearGradient id="paint0_linear_125_4839" x1="10" y1="0" x2="10" y2="20" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#3A76F0" />
                            <stop offset="1" stop-color="#012A7D" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {`Created ${formatRelativeLong(pairing.createdAt)}`}
                    </span>
                  </div>
                </div>

                {/* Share URL Input & Action Row */}
                {!isPublicView && (
                  <div className="flex flex-col gap-2 relative z-10 w-full">
                    <span className="text-xs font-bold tracking-wider text-white/70">
                      Share Event Link
                    </span> <div className="flex flex-col md:flex-row">
                      <div className="flex flex-col md:flex-row items-stretch w-[80%] md:items-center gap-3 bg-white/10 border border-white/20 rounded-[1.25rem] md:rounded-full p-1.5">
                        <input
                          type="text"
                          readOnly
                          value={formUrl}
                          className="bg-transparent text-white placeholder-white/50 border-0 outline-none text-xs md:text-sm select-all w-full min-w-0 truncate px-3 py-2 flex-grow"
                          placeholder="Event Registration Link"
                        />

                        {/* Actions inside the bar */}
                        <div className="flex items-center gap-2 px-1 flex-shrink-0">
                          {/* Copy Link Button */}
                          <button
                            onClick={handleCopyFormLink}
                            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-full px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold select-none cursor-pointer transition-all active:scale-95"
                          >
                            {copiedLinkLocal ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            )}
                            {copiedLinkLocal ? "Copied!" : "Copy Link"}
                          </button>
                        </div> </div>
                      <div className="flex flex-col md:flex-row  md:items-center gap-3 bg-white/10 border border-white/20 rounded-[1.25rem] md:rounded-full p-1.5">

                        {/* Export CSV (Only for role based) */}
                        {pairing.type === "role-based" && (
                          <button
                            onClick={handleExportCSV}
                            className="bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-full px-4 py-2 flex items-center justify-center gap-1.5 text-xs font-semibold select-none cursor-pointer transition-all active:scale-95"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Export CSV
                          </button>
                        )}


                        {/* Share trigger */}
                        <button
                          onClick={handleShareClick}
                          className="bg-white/10 hover:bg-white/20 border border-white/30 text-white p-2.5 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-95"
                          title="Share link"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <circle cx="18" cy="5" r="3"></circle>
                            <circle cx="6" cy="12" r="3"></circle>
                            <circle cx="18" cy="19" r="3"></circle>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Speed Networking Multi-Round Matrix */}
              {pairing.isSpeedNetworking && (
                <SpeedNetworkingMatrix
                  participants={eventPeople(pairing)}
                  eventName={pairing.groupingPurpose}
                  initialRounds={pairing.speedNetworkingRounds || 3}
                  isPublicView={isPublicView}
                />
              )}

              {/* Event Stats capsules */}
              <EventStats
                pairing={pairing}
                filledSlots={filledSlots}
                totalSlots={totalSlots}
                fillPercentage={fillPercentage}
              />

              {/* Dynamic list layout */}
              {pairing.type === "random-positioning" ? (
                <RandomPositioningResult data={pairing} isPublicView={isPublicView} />
              ) : pairing.type === "secret-santa" ? (
                <SecretSantaList pairing={pairing} userId={userId} isPublicView={isPublicView} />
              ) : (
                <RoleBasedList pairing={pairing} isPublicView={isPublicView} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Result;
