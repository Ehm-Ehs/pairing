import { errorMessage } from "@/utils/errors";
import { useState } from "react";
import { toast } from "react-toastify";
import { RoleBasedPairing, Participant } from "../types";
import { removeEventParticipants } from "../services/endpoints";

export const useRoleBasedActions = (
  pairing: RoleBasedPairing,
  userId: string,
  selectedIds: Set<string>,
  setSelectedIds: (s: Set<string>) => void
) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const canModify = () => {
    if (!userId) {
      toast.error("User session not found.");
      return false;
    }
    if (pairing.status === "locked") {
      toast.error("This event is closed. Slots cannot be modified.");
      return false;
    }
    return true;
  };

  const handleClearSlot = async (_groupKey: string, participant: Participant) => {
    if (!canModify()) return;
    if (confirm(`Are you sure you want to remove ${participant.name} from this slot?`)) {
      setIsDeleting(participant.id);
      try {
        await removeEventParticipants(pairing.id, [participant.id]);
        toast.success("Participant removed from slot.");
        const newSelected = new Set(selectedIds);
        newSelected.delete(participant.id);
        setSelectedIds(newSelected);
      } catch (err) {
        toast.error("Failed to remove participant: " + errorMessage(err));
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleBulkClearSlots = async () => {
    if (!canModify() || selectedIds.size === 0) return;

    if (confirm(`Are you sure you want to remove the ${selectedIds.size} selected participants?`)) {
      setIsDeleting("bulk");
      try {
        const { removed } = await removeEventParticipants(pairing.id, Array.from(selectedIds));
        if (removed > 0) {
          toast.success(`Successfully removed ${removed} participants.`);
          setSelectedIds(new Set());
        } else {
          toast.error("No selected participants found in groups.");
        }
      } catch (err) {
        toast.error("Failed to perform bulk remove: " + errorMessage(err));
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return { isDeleting, handleClearSlot, handleBulkClearSlots };
};
