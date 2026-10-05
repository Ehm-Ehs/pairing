import { errorMessage } from "@/utils/errors";
import { useState } from "react";
import { toast } from "react-toastify";
import { SecretSantaPairing } from "../types";
import { generateDraw, removeEventParticipants } from "../services/endpoints";

export function useSecretSantaActions(
  pairing: SecretSantaPairing,
  userId: string,
  selectedIds: Set<string>,
  clearSelection: () => void
) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleClearSlot = async (participantId: string, name: string) => {
    if (!userId || pairing.status === "locked") return toast.error("Cannot modify participants.");
    if (confirm(`Are you sure you want to remove ${name}?`)) {
      setIsDeleting(participantId);
      try {
        await removeEventParticipants(pairing.id, [participantId]);
        toast.success("Participant removed.");
        clearSelection();
      } catch (err) {
        toast.error("Failed to remove participant: " + errorMessage(err));
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleBulkClearSlots = async () => {
    if (!userId || pairing.status === "locked" || selectedIds.size === 0) return;
    if (confirm(`Remove the ${selectedIds.size} selected participants?`)) {
      setIsDeleting("bulk");
      try {
        const { removed } = await removeEventParticipants(pairing.id, Array.from(selectedIds));
        toast.success(`Removed ${removed} participants.`);
        clearSelection();
      } catch (err) {
        toast.error("Bulk remove failed: " + errorMessage(err));
      } finally {
        setIsDeleting(null);
      }
    }
  };

  /** The server draws the pairs and sends each participant their match privately. */
  const handleGenerateClick = async () => {
    setIsDeleting("generate");
    try {
      await generateDraw(pairing.id);
      toast.success("Pairs generated! Each participant has been sent their match privately.");
    } catch (error) {
      toast.error("Failed to generate pairs: " + errorMessage(error));
    } finally {
      setIsDeleting(null);
    }
  };

  return { isDeleting, handleClearSlot, handleBulkClearSlots, handleGenerateClick };
}
