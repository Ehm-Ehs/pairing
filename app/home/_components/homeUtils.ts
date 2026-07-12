import { Pairing } from "../../../src/types";
import { toast } from "react-toastify";
import { auth } from "../../../src/services/firebase";

export const getEventStats = (event: Pairing) => {
  if (event.type === "secret-santa") {
    const totalSlots = event.config?.expectedParticipants || 0;
    const filledSlots = event.participants ? event.participants.length : 0;
    const fillPercentage =
      totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
    return { totalSlots, filledSlots, fillPercentage };
  }

  if (event.type === "random-positioning") {
    const filledSlots = event.participants?.length || 0;
    const totalSlots = filledSlots; // Dynamic size
    const fillPercentage = 100; // Visual indicator
    return { totalSlots, filledSlots, fillPercentage };
  }

  // Default to Role-Based logic
  const totalSlots = parseInt(event.numParticipants.toString());
  let filledSlots = 0;
  Object.values(event.groups).forEach((group) => {
    // Only count participants that have a name
    filledSlots += group.filter((p: any) => p.name).length;
  });

  const fillPercentage =
    totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  return { totalSlots, filledSlots, fillPercentage };
};

export const copyJoinLink = (event: Pairing) => {
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

  const uid = auth.currentUser?.uid || storageUid || "";
  const url = `${window.location.origin}/event/results/${uid}/${event.id}`;

  let copied = false;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url);
    copied = true;
  } else {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      copied = document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch (err) {
      console.error("Fallback copy failed:", err);
    }
  }

  if (copied) {
    toast.success("Link copied to clipboard!");
  } else {
    toast.error("Failed to copy link. Please check your browser permissions.");
  }
};
