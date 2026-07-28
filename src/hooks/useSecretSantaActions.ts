import { useState } from "react";
import { toast } from "react-toastify";
import { SecretSantaPairing } from "../types";
import { removeParticipantFromSecretSanta } from "../services/endpoints";

export function useSecretSantaActions(pairing: SecretSantaPairing, userId: string, selectedIds: Set<string>, clearSelection: () => void) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleClearSlot = async (participantId: string, name: string) => {
    if (!userId || pairing.status === "locked") return toast.error("Cannot modify participants.");
    if (confirm(`Are you sure you want to remove ${name}?`)) {
      setIsDeleting(participantId);
      try {
        await removeParticipantFromSecretSanta(userId, pairing.id, participantId);
        toast.success("Participant removed.");
        clearSelection();
      } catch (err: any) {
        toast.error("Failed to remove participant: " + err.message);
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
        const { doc, getDoc, setDoc } = await import("firebase/firestore");
        const { db } = await import("../services/firebase");
        
        const pairingRef = doc(db, "Pairings", pairing.id);
        const pairingSnap = await getDoc(pairingRef);

        if (pairingSnap.exists()) {
          const localPairing = pairingSnap.data() as SecretSantaPairing;
          if (localPairing.participants) {
            localPairing.participants = localPairing.participants.filter((p: any) => !selectedIds.has(p.id));
            if (localPairing.pairs) {
              localPairing.pairs = localPairing.pairs.filter((pair: any) => !selectedIds.has(pair.santaId) && !selectedIds.has(pair.receiverId));
            }
            await setDoc(pairingRef, JSON.parse(JSON.stringify(localPairing)), { merge: true });
            toast.success(`Removed ${selectedIds.size} participants.`);
            clearSelection();
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
              if (localPairing.participants) {
                localPairing.participants = localPairing.participants.filter((p: any) => !selectedIds.has(p.id));
                if (localPairing.pairs) {
                  localPairing.pairs = localPairing.pairs.filter((pair: any) => !selectedIds.has(pair.santaId) && !selectedIds.has(pair.receiverId));
                }
                await setDoc(userRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
                toast.success(`Removed ${selectedIds.size} participants.`);
                clearSelection();
              }
            }
          }
        }
      } catch (err: any) {
        toast.error("Bulk remove failed: " + err.message);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleGenerateClick = async () => {
    setIsDeleting("generate");
    try {
      const { generateSecretSantaPairs } = await import("../services/endpoints");
      const updatedPairing = await generateSecretSantaPairs(userId, pairing.id);
      toast.success("Pairs generated successfully!");

      if (updatedPairing && updatedPairing.pairs) {
        const { sendEmail } = await import("../services/email");
        const { getPairingEmail } = await import("../services/emailTemplates");
        updatedPairing.pairs.forEach((pair: any) => {
          const santa = updatedPairing.participants.find((p: any) => p.id === pair.santaId);
          const receiver = updatedPairing.participants.find((p: any) => p.id === pair.receiverId);
          if (santa && santa.email && receiver) {
            const emailContent = getPairingEmail(updatedPairing.title || "Secret Santa", santa.name, receiver.name, true);
            sendEmail({ to: santa.email, subject: emailContent.subject, html: emailContent.html });
          }
        });
      }
    } catch (error: any) {
      toast.error("Failed to generate pairs: " + error.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return { isDeleting, handleClearSlot, handleBulkClearSlots, handleGenerateClick };
}
