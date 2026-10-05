import { errorMessage } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { useState } from "react";
import { toast } from "react-toastify";
import { generateDraw, removeEventParticipants } from "../services/endpoints";
import { RandomPositioningPairing } from "../types";

export const useRandomPositioningActions = (
  data: RandomPositioningPairing,
  selectedIds: Set<string>,
  setSelectedIds: (s: Set<string>) => void
) => {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /** The server shuffles the positions and notifies each participant. */
  const handleGenerate = async () => {
    if (data.participants.length < 1) {
      toast.error("Need at least 1 participant to shuffle!");
      return;
    }

    if (!window.confirm("Are you sure? This will shuffle and assign random positions (1st, 2nd, etc.) to all checked-in participants.")) {
      return;
    }

    setLoading(true);
    try {
      await generateDraw(data.id);
      toast.success("Positions successfully generated!");
    } catch (error) {
      logger.error(error);
      toast.error(errorMessage(error) || "Failed to generate positions");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (participantId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    setIsDeleting(participantId);
    try {
      await removeEventParticipants(data.id, [participantId]);
      toast.success("Participant removed successfully");
      const newSelected = new Set(selectedIds);
      newSelected.delete(participantId);
      setSelectedIds(newSelected);
    } catch {
      toast.error("Failed to remove participant");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Remove ${selectedIds.size} selected participants?`)) return;

    setIsDeleting("bulk");
    try {
      await removeEventParticipants(data.id, Array.from(selectedIds));
      toast.success("Selected participants removed");
    } catch (err) {
      logger.error(err);
      toast.error("Failed to remove participants");
    } finally {
      setIsDeleting(null);
      setSelectedIds(new Set());
    }
  };

  return { loading, isDeleting, handleGenerate, handleRemove, handleBulkDelete };
};
