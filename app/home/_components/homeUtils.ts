import { auth } from "../../../src/services/firebase";
import { Pairing } from "../../../src/types";
import { toast } from "react-toastify";

export const formatGroupName = (assignedGroupKey: any): string => {
  if (assignedGroupKey === undefined || assignedGroupKey === null) return "Group 1";
  
  if (typeof assignedGroupKey === "number") {
    return `Group ${assignedGroupKey + 1}`;
  }
  
  const parsed = parseInt(String(assignedGroupKey), 10);
  if (!isNaN(parsed)) {
    return `Group ${parsed + 1}`;
  }
  
  return `Group ${assignedGroupKey}`;
};

export const getEventStats = (event: Pairing) => {
  if (event.type === "secret-santa") {
    const participantsCount = event.participants?.length || 0;
    const pairsCount = event.pairs?.length || 0;
    const fillPct = pairsCount > 0 ? 100 : 0;
    return {
      filledSlots: participantsCount,
      totalSlots: participantsCount,
      fillPercentage: fillPct,
      label: "Participants",
      count: participantsCount,
      subText: pairsCount > 0 ? `${pairsCount} Pairs Drawn` : "Not Drawn Yet",
    };
  }

  if (event.type === "random-positioning") {
    const participantsCount = event.participants?.length || 0;
    const totalPositions = (event as any).totalPositions || participantsCount || 1;
    const fillPct = Math.min(100, Math.round((participantsCount / Math.max(1, totalPositions)) * 100));
    return {
      filledSlots: participantsCount,
      totalSlots: totalPositions,
      fillPercentage: fillPct,
      label: "Participants",
      count: participantsCount,
      subText: `${participantsCount}/${totalPositions} Positions Claimed`,
    };
  }

  // Role-based
  let filledSlots = 0;
  let totalSlots = (event as any).numParticipants || 0;
  if ((event as any).groups) {
    Object.values((event as any).groups).forEach((groupMembers: any) => {
      if (Array.isArray(groupMembers)) {
        groupMembers.forEach((member: any) => {
          if (member.name && member.name.trim() !== "") {
            filledSlots++;
          }
        });
      }
    });
  }

  const fillPct = totalSlots > 0 ? Math.min(100, Math.round((filledSlots / totalSlots) * 100)) : 0;

  return {
    filledSlots,
    totalSlots,
    fillPercentage: fillPct,
    label: "Members Filled",
    count: filledSlots,
    subText: totalSlots > 0 ? `${filledSlots}/${totalSlots} Slots Filled` : `${filledSlots} Members`,
  };
};

export const copyJoinLink = async (event: Pairing) => {
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

  const uid = (event as any).ownerId || auth.currentUser?.uid || storageUid || "";
  const url = `${window.location.origin}/event/results/${uid}/${event.id}`;
  const textToCopy = url;

  let success = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textToCopy);
      success = true;
    }
  } catch (err) {
    console.warn("Clipboard API writeText failed, using fallback:", err);
  }

  if (!success) {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      success = document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
  }

  if (success) {
    toast.success("Link copied to clipboard!");
  } else {
    toast.error("Failed to copy link. Please check browser permissions.");
  }
};
