import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { GroupingsPageProps } from "../../../src/types";
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
import { useResultActions } from "../../../src/hooks/useResultActions";
import { closePairingEvent } from "../../../src/services/endpoints";
import { auth } from "../../../src/services/firebase";
import { useState } from "react";
import { toast } from "react-toastify";
import { formatGroupName } from "../../../src/utils/stringUtils";


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

const Result = ({ data, isPublicView = false }: ResultProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isClosing, setIsClosing] = useState(false);
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

  const {
    copiedLink,
    copiedFormUrl,
    isShortened,
    setIsShortened,
    isLoadingLink,
    isLoadingForm,
    handleShare,
    handleFormRedirect,
  } = useResultActions(data, selectedIndex);

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

  const userId = data?.userId || data?.uid || auth.currentUser?.uid || storageUid || "";

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500 font-semibold">
        No data available
      </div>
    );
  }

  if (idParam && selectedIndex === null && data) {
    return (
      <div className="p-8 text-center text-gray-500 font-semibold">
        Loading event details...
      </div>
    );
  }

  const pairingsToRender =
    selectedIndex !== null && data.pairings ? [data.pairings[selectedIndex]] : (data.pairings || []);

  const handleCloseEventClick = (eventId: string) => {
    toast(
      ({ closeToast }) => (
        <div className="flex flex-col gap-2.5 text-left p-1">
          <p className="font-bold text-gray-900 text-sm font-heading">
            Close Event?
          </p>
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            Are you sure you want to close this event? No further registrations will be allowed.
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={closeToast}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-1.5 rounded-full text-[10px] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                closeToast();
                setIsClosing(true);
                try {
                  await closePairingEvent(userId, eventId);
                  toast.success("Event closed successfully!");
                } catch (err: any) {
                  console.error("Failed to close event:", err);
                  toast.error("Failed to close event: " + err.message);
                } finally {
                  setIsClosing(false);
                }
              }}
              className="bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold px-4 py-1.5 rounded-full text-[10px] shadow-sm transition-colors cursor-pointer"
            >
              Close Event
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      }
    );
  };

  const getFormattedDate = (createdAt: any) => {
    try {
      const date = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
      if (isNaN(date.getTime())) return "Recent Event";
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recent Event";
    }
  };

  const getCreatedTimeAgo = (createdAt: any) => {
    try {
      const date = createdAt?.seconds ? new Date(createdAt.seconds * 1000) : new Date(createdAt);
      if (isNaN(date.getTime())) return "Recently";
      const diffMs = Date.now() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `Created ${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
      }
      if (diffHours < 24) {
        return `Created ${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
      }
      const diffDays = Math.floor(diffHours / 24);
      return `Created ${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen py-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        {pairingsToRender.map((pairing, index) => {
          const originalIndex = selectedIndex !== null ? selectedIndex : index;

          let totalSlots = 0;
          let filledSlots = 0;

          if (pairing.type === "random-positioning") {
            totalSlots = pairing.participants.length;
            filledSlots = pairing.participants.length;
          } else if (pairing.type === "secret-santa") {
            totalSlots = pairing.config?.expectedParticipants || 0;
            filledSlots = pairing.participants ? pairing.participants.length : 0;
          } else {
            totalSlots = parseInt(pairing.numParticipants.toString());
            Object.values(pairing.groups || {}).forEach((group) => {
              filledSlots += group.filter((p: any) => p.name).length;
            });
          }

          const fillPercentage =
            totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

          // Generate Form URL
          const getFormUrl = () => {
            if (pairing.type === "secret-santa") {
              return `${window.location.origin}/event/${userId}/${pairing.id}`;
            } else if (pairing.type === "random-positioning") {
              return `${window.location.origin}/event/rp/${userId}/${pairing.id}`;
            }
            const serializedPairings = encodeURIComponent(JSON.stringify(pairing.groups || {}));
            const encryptedUserId = btoa(userId || "");
            return `${window.location.origin}/form?groupingPurpose=${encodeURIComponent(
              pairing.groupingPurpose
            )}&numGroups=${pairing.numGroups}&numParticipants=${pairing.numParticipants
              }&characteristicsLabel=${encodeURIComponent(
                pairing.characteristicsLabel || ""
              )}&pairings=${serializedPairings}&userId=${encryptedUserId}`;
          };

          const formUrl = getFormUrl();

          const handleCopyFormLink = async () => {
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(formUrl);
              } else {
                // Fallback for non-secure contexts or compatibility issues
                const textarea = document.createElement("textarea");
                textarea.value = formUrl;
                textarea.style.position = "fixed";
                textarea.style.top = "0";
                textarea.style.left = "0";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
              }
              setCopiedLinkLocal(true);
              setTimeout(() => setCopiedLinkLocal(false), 3000);
            } catch (err) {
              console.error("Failed to copy link:", err);
            }
          };

          const handleExportCSV = () => {
            if (pairing.type !== "role-based") return;
            try {
              let csvContent = "data:text/csv;charset=utf-8,";
              csvContent += "Group,Slot Number,Role,Name,Email\n";

              Object.entries(pairing.groups || {}).forEach(([groupKey, group]) => {
                const groupName = formatGroupName(groupKey);
                group.forEach((member) => {
                  const name = member.name || "Available Slot";
                  const email = member.email || "";
                  csvContent += `"${groupName}",${member.number},"${member.role}","${name}","${email}"\n`;
                });
              });

              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", `${pairing.groupingPurpose.replace(/\s+/g, "_")}_pairings.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (err) {
              console.error("Failed to export CSV:", err);
            }
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
                console.log("Error sharing:", err);
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
                      {pairing.type === "role-based" ? "Group Pairs" :
                        pairing.type === "secret-santa"
                          ? (pairing.config?.allowWishlist ? "Secret Santa" : "Just Pair")
                          : ((pairing as any).assignmentMode === "fcfs" ? "First Come, First Served" :
                             (pairing as any).assignmentMode === "random" ? "Random Assignment" : "Participants Pick")}
                    </span>
                    {pairing.type === "random-positioning" && (
                      <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-white/15 text-white border border-white/20">
                        {(pairing as any).hideNames ? "Names Hidden" : "Names Public"}
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

                      {getFormattedDate(pairing.createdAt)}
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

                      {getCreatedTimeAgo(pairing.createdAt)}
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
