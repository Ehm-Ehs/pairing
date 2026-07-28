import { useState } from "react";
import { toast } from "react-toastify";
import { RoleBasedPairing, Participant } from "../types";
import { editPairingValue } from "../services/endpoints";

export const useRoleBasedActions = (pairing: RoleBasedPairing, userId: string, selectedIds: Set<string>, setSelectedIds: (s: Set<string>) => void) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleClearSlot = async (groupKey: string, participant: Participant) => {
    if (!userId) {
      toast.error("User session not found.");
      return;
    }
    if (pairing.status === "locked") {
      toast.error("This event is closed. Slots cannot be modified.");
      return;
    }
    if (confirm(`Are you sure you want to remove ${participant.name} from this slot?`)) {
      setIsDeleting(participant.id);
      try {
        await editPairingValue(
          userId,
          pairing.groupingPurpose,
          groupKey,
          0,
          participant.id,
          { name: "", email: "", track: "" }
        );
        toast.success("Participant removed from slot.");
        
        const newSelected = new Set(selectedIds);
        newSelected.delete(participant.id);
        setSelectedIds(newSelected);
      } catch (err: any) {
        toast.error("Failed to remove participant: " + err.message);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleBulkClearSlots = async () => {
    if (!userId) {
      toast.error("User session not found.");
      return;
    }
    if (pairing.status === "locked") {
      toast.error("This event is closed. Slots cannot be modified.");
      return;
    }
    if (selectedIds.size === 0) return;

    if (confirm(`Are you sure you want to remove the ${selectedIds.size} selected participants?`)) {
      setIsDeleting("bulk");
      try {
        const { doc, getDoc, setDoc } = await import("firebase/firestore");
        const { db } = await import("../services/firebase");
        
        const pairingRef = doc(db, "Pairings", pairing.id);
        const pairingSnap = await getDoc(pairingRef);

        if (pairingSnap.exists()) {
          const localPairing = pairingSnap.data() as RoleBasedPairing;
          const groups = localPairing.groups || {};
          localPairing.groups = groups;
          let countCleared = 0;
          
          Object.entries(groups).forEach(([groupKey, group]: any) => {
            groups[groupKey] = group.map((member: any) => {
              if (selectedIds.has(member.id)) {
                countCleared++;
                return { ...member, name: "", email: "" };
              }
              return member;
            });
          });

          if (countCleared > 0) {
            await setDoc(pairingRef, JSON.parse(JSON.stringify(localPairing)), { merge: true });
            toast.success(`Successfully removed ${countCleared} participants.`);
            setSelectedIds(new Set());
          } else {
            toast.error("No selected participants found in groups.");
          }
        } else {
          // Legacy fallback
          const userRef = doc(db, "Users", userId);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            const pairings = userData.pairings || [];
            const pairingIndex = pairings.findIndex((p: any) => p.id === pairing.id);
            
            if (pairingIndex !== -1) {
              const localPairing = pairings[pairingIndex];
              const groups = localPairing.groups || {};
              localPairing.groups = groups;
              let countCleared = 0;
              
              Object.entries(groups).forEach(([groupKey, group]: any) => {
                groups[groupKey] = group.map((member: any) => {
                  if (selectedIds.has(member.id)) {
                    countCleared++;
                    return { ...member, name: "", email: "" };
                  }
                  return member;
                });
              });

              if (countCleared > 0) {
                await setDoc(userRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
                toast.success(`Successfully removed ${countCleared} participants.`);
                setSelectedIds(new Set());
              }
            }
          }
        }
      } catch (err: any) {
        toast.error("Failed to perform bulk remove: " + err.message);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return { isDeleting, handleClearSlot, handleBulkClearSlots };
};
