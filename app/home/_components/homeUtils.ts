import { Pairing } from "../../../src/types";
import { toast } from "react-toastify";

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
  let url = "";
  if (event.type === "secret-santa") {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user.uid || "";
    url = `${window.location.origin}/event/${uid}/${event.id}`;
  } else if (event.type === "random-positioning") {
    // Logic from Home.tsx that was added in previous steps
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const uid = user.uid || "";
    url = `${window.location.origin}/event/rp/${uid}/${event.id}`;
  } else {
    url = `${window.location.origin}/share?groupingPurpose=${encodeURIComponent(
      event.groupingPurpose
    )}`;
  }

  navigator.clipboard.writeText(url);
  toast.success("Link copied to clipboard!");
};
