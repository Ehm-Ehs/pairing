import { useState } from "react";
import { toast } from "react-toastify";
import { generateRandomPositions, removeParticipantFromRandomPositioning } from "../services/endpoints";
import { RandomPositioningPairing } from "../types";
import { auth } from "../services/firebase";

export const useRandomPositioningActions = (
  data: RandomPositioningPairing,
  selectedIds: Set<string>,
  setSelectedIds: (s: Set<string>) => void
) => {
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

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
      const pairing = await generateRandomPositions(auth.currentUser!.uid, data.id);
      toast.success("Positions successfully generated!");

      if (pairing && pairing.participants) {
        import("../services/email").then(({ sendEmail }) => {
          import("../services/emailTemplates").then(({ getPairingEmail }) => {
            pairing.participants.forEach((p: any) => {
              if (p.email && p.assignedNumber) {
                const emailContent = getPairingEmail(
                  pairing.title || "Random Positioning Event",
                  p.name,
                  `Position #${p.assignedNumber}`,
                  false
                );
                sendEmail({ to: p.email, subject: emailContent.subject, html: emailContent.html });
              }
            });
          });
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate positions");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (participantId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?`)) return;
    setIsDeleting(participantId);
    try {
      await removeParticipantFromRandomPositioning(auth.currentUser!.uid, data.id, participantId);
      toast.success("Participant removed successfully");
      const newSelected = new Set(selectedIds);
      newSelected.delete(participantId);
      setSelectedIds(newSelected);
    } catch (err) {
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
      const { doc, getDoc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../services/firebase");

      const pairingRef = doc(db, "Pairings", data.id);
      const pairingSnap = await getDoc(pairingRef);

      if (pairingSnap.exists()) {
        const localPairing = pairingSnap.data() as RandomPositioningPairing;
        if (localPairing.participants) {
          localPairing.participants = localPairing.participants.filter(
            (p: any) => !selectedIds.has(p.id)
          );
          await setDoc(pairingRef, JSON.parse(JSON.stringify(localPairing)), { merge: true });
          toast.success("Selected participants removed");
        }
      } else {
        // Legacy fallback
        const userRef = doc(db, "Users", auth.currentUser!.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const pairings = userData.pairings || [];
          const pairingIndex = pairings.findIndex((p: any) => p.id === data.id);

          if (pairingIndex !== -1) {
            const localPairing = pairings[pairingIndex];
            if (localPairing.participants) {
              localPairing.participants = localPairing.participants.filter(
                (p: any) => !selectedIds.has(p.id)
              );
              pairings[pairingIndex] = localPairing;
              await setDoc(userRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
              toast.success("Selected participants removed");
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove participants");
    } finally {
      setIsDeleting(null);
      setSelectedIds(new Set());
    }
  };

  return { loading, isDeleting, handleGenerate, handleRemove, handleBulkDelete };
};
