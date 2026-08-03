"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../src/services/firebase";
import JoinSecretSanta from "../../_components/JoinSecretSanta";
import JoinRandomPositioning from "../../_components/JoinRandomPositioning";
import { Loading } from "../../../../src/components/ui/loading";
import { Pairing } from "../../../../src/types";

// Function to encrypt userId
const encryptData = (data: string): string => {
  return btoa(data);
};

export default function SmartJoinEventClient() {
  const { userId, eventId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState<Pairing | null>(null);

  const validUserId = Array.isArray(userId) ? userId[0] : userId;
  const validEventId = Array.isArray(eventId) ? eventId[0] : eventId;

  useEffect(() => {
    const fetchEventAndRoute = async () => {
      if (!validUserId || !validEventId) return;

      try {
        // 1. Try Pairings collection
        const pairingDoc = await getDoc(doc(db, "Pairings", validEventId));
        if (pairingDoc.exists()) {
          const foundPairing = pairingDoc.data() as Pairing;
          setPairing(foundPairing);

          if (foundPairing.type === "role-based") {
            // Redirect to role-based selection form
            const serializedPairings = encodeURIComponent(
              JSON.stringify(foundPairing.groups)
            );
            const encryptedUserId = encryptData(validUserId);
            const formUrl = `/form?groupingPurpose=${encodeURIComponent(
              foundPairing.groupingPurpose || foundPairing.title
            )}&numGroups=${foundPairing.numGroups}&numParticipants=${
              foundPairing.numParticipants
            }&characteristicsLabel=${encodeURIComponent(
              foundPairing.characteristicsLabel || ""
            )}&pairings=${serializedPairings}&userId=${encryptedUserId}`;
            router.replace(formUrl);
            return;
          }
        } else {
          // 2. Legacy User fallback
          const userDoc = await getDoc(doc(db, "Users", validUserId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const foundPairing = userData.pairings?.find(
              (p: Pairing) => p.id === validEventId
            );
            if (foundPairing) {
              setPairing(foundPairing);
              if (foundPairing.type === "role-based") {
                const serializedPairings = encodeURIComponent(
                  JSON.stringify(foundPairing.groups)
                );
                const encryptedUserId = encryptData(validUserId);
                const formUrl = `/form?groupingPurpose=${encodeURIComponent(
                  foundPairing.groupingPurpose || foundPairing.title
                )}&numGroups=${foundPairing.numGroups}&numParticipants=${
                  foundPairing.numParticipants
                }&characteristicsLabel=${encodeURIComponent(
                  foundPairing.characteristicsLabel || ""
                )}&pairings=${serializedPairings}&userId=${encryptedUserId}`;
                router.replace(formUrl);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.error("Error routing join event:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndRoute();
  }, [validUserId, validEventId, router]);

  if (loading) {
    return <Loading message="Loading event registration..." />;
  }

  if (pairing?.type === "random-positioning") {
    return <JoinRandomPositioning />;
  }

  return <JoinSecretSanta />;
}
