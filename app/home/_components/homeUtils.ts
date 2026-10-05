import { copyToClipboard } from "@/utils/clipboard";
import { countSlots } from "@/utils/eventStats";
import { absoluteUrl, resultsPath } from "@/utils/eventLinks";
import { auth } from "@/services/firebase";
import { Pairing } from "@/types";
import { toast } from "react-toastify";

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

  const { filledSlots, totalSlots, fillPercentage } = countSlots(event);

  if (event.type === "random-positioning") {
    const totalPositions = Math.max(1, totalSlots);
    return {
      filledSlots,
      totalSlots: totalPositions,
      fillPercentage,
      label: "Participants",
      count: filledSlots,
      subText: `${filledSlots}/${totalPositions} Positions Claimed`,
    };
  }

  return {
    filledSlots,
    totalSlots,
    fillPercentage,
    label: "Members Filled",
    count: filledSlots,
    subText: totalSlots > 0 ? `${filledSlots}/${totalSlots} Slots Filled` : `${filledSlots} Members`,
  };
};

/** Copies the event's public results link. */
export const copyJoinLink = async (event: Pairing) => {
  const uid = event.createdBy || event.ownerId || auth.currentUser?.uid || "";
  const copied = await copyToClipboard(absoluteUrl(resultsPath(event, uid)));
  if (copied) toast.success("Link copied to clipboard!");
  else toast.error("Failed to copy link. Please check browser permissions.");
};
