import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import Auth from "./auth.module";

import { Pairing } from "../types";

export const fetchUserData = async (
  setUserDetails: (data: any) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (Auth.isUserAuthenticated()) {
      const token = Auth.getToken();
      console.log({ token });

      auth.onAuthStateChanged(async (user) => {
        if (user) {
          try {
            const userDocRef = doc(db, "Users", user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userData = userDocSnap.exists() ? userDocSnap.data() : {};

            // Query top-level Pairings collection for this user's events
            const collectionPairings: Pairing[] = [];
            try {
              const pairingsQuery = query(
                collection(db, "Pairings"),
                where("ownerId", "==", user.uid)
              );
              const pairingsSnap = await getDocs(pairingsQuery);
              pairingsSnap.forEach((docSnap) => {
                collectionPairings.push(docSnap.data() as Pairing);
              });
            } catch (queryErr) {
              console.warn("Could not query Pairings collection directly:", queryErr);
            }

            // For backwards compatibility, merge legacy pairings from User doc
            const legacyPairings: Pairing[] = userData.pairings || [];
            const mergedMap = new Map<string, Pairing>();
            legacyPairings.forEach((p) => {
              if (p && p.id) mergedMap.set(p.id, p);
            });
            collectionPairings.forEach((p) => {
              if (p && p.id) mergedMap.set(p.id, p);
            });

            const allPairings = Array.from(mergedMap.values()).sort(
              (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
            );

            setUserDetails({
              ...userData,
              pairings: allPairings,
            });
            resolve();
          } catch (error) {
            console.error("Error fetching user data:", error);
            reject(error);
          }
        } else {
          console.log("No user is logged in");
          Auth.deAuthenticateUser();
          setUserDetails(null);
          resolve();
        }
      });
    } else {
      console.log("User is not authenticated");
      setUserDetails(null);
      resolve();
    }
  });
};

export async function addPairing(userId: string, pairingData: Pairing) {
  try {
    const sanitizedPairing = JSON.parse(
      JSON.stringify({
        ...pairingData,
        ownerId: userId,
      })
    );

    // 1. Save as standalone document in top-level Pairings collection
    const pairingRef = doc(db, "Pairings", pairingData.id);
    await setDoc(pairingRef, sanitizedPairing);

    // 2. Also sync to Users/{userId}.pairings for dual-write compatibility & realtime listeners
    try {
      const userRef = doc(db, "Users", userId);
      const userDocSnap = await getDoc(userRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const existingPairings: Pairing[] = userData.pairings || [];
        const updatedPairings = [
          sanitizedPairing,
          ...existingPairings.filter((p) => p.id !== pairingData.id),
        ];
        await setDoc(
          userRef,
          { pairings: JSON.parse(JSON.stringify(updatedPairings)) },
          { merge: true }
        );
      }
    } catch (userDocErr) {
      console.warn("Could not sync pairing to User doc:", userDocErr);
    }

    console.log("Pairing document created successfully!");
  } catch (error) {
    console.error("Error adding pairing:", error);
    throw error;
  }
}

// Helper to get pairing document regardless of whether it's in Pairings collection or legacy Users doc
async function getPairingRefAndData(
  userId: string,
  eventId?: string,
  groupingPurpose?: string
): Promise<{
  pairingRef: any;
  pairing: any;
  isCollectionDoc: boolean;
  legacyUserDocSnap?: any;
  legacyPairingIndex?: number;
}> {
  // 1. Try finding by eventId in Pairings collection
  if (eventId) {
    const pairingRef = doc(db, "Pairings", eventId);
    const docSnap = await getDoc(pairingRef);
    if (docSnap.exists()) {
      return {
        pairingRef,
        pairing: docSnap.data(),
        isCollectionDoc: true,
      };
    }
  }

  // 2. Try querying Pairings collection by groupingPurpose & ownerId
  if (groupingPurpose && userId) {
    const q = query(
      collection(db, "Pairings"),
      where("ownerId", "==", userId),
      where("groupingPurpose", "==", groupingPurpose)
    );
    const qSnap = await getDocs(q);
    if (!qSnap.empty) {
      const docSnap = qSnap.docs[0];
      return {
        pairingRef: docSnap.ref,
        pairing: docSnap.data(),
        isCollectionDoc: true,
      };
    }
  }

  // 3. Fallback to legacy Users doc array
  if (userId) {
    const userRef = doc(db, "Users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const legacyPairings = userData.pairings || [];
      const index = legacyPairings.findIndex((p: any) =>
        eventId ? p.id === eventId : p.groupingPurpose === groupingPurpose
      );
      if (index !== -1) {
        return {
          pairingRef: userRef,
          pairing: legacyPairings[index],
          isCollectionDoc: false,
          legacyUserDocSnap: userSnap,
          legacyPairingIndex: index,
        };
      }
    }
  }

  throw new Error("Event not found");
}

export async function editPairingValue(
  userId: string,
  groupingPurpose: string,
  groupKey: string,
  _keyIndex: number,
  id: string,
  newValue: { name: string; track: string; email: string }
) {
  try {
    const { pairingRef, pairing, isCollectionDoc, legacyUserDocSnap, legacyPairingIndex } =
      await getPairingRefAndData(userId, undefined, groupingPurpose);

    if (pairing.status === "locked") {
      throw new Error("This event is closed. No further registrations are allowed.");
    }

    // Check if email already exists in any of the groups for this event
    if (newValue.email && newValue.email.trim() !== "") {
      const emailLower = newValue.email.trim().toLowerCase();
      let isDuplicate = false;

      Object.entries(pairing.groups || {}).forEach(([_gKey, groupMembers]: [string, any]) => {
        if (Array.isArray(groupMembers)) {
          groupMembers.forEach((member: any) => {
            if (member.id !== id && member.email && member.email.trim().toLowerCase() === emailLower) {
              isDuplicate = true;
            }
          });
        }
      });

      if (isDuplicate) {
        throw new Error("This email is already registered for this event.");
      }
    }

    const groups = pairing.groups;
    if (groups && groups[groupKey]) {
      const group = groups[groupKey];
      const participantIndex = group.findIndex((p: any) => p.id === id);

      if (participantIndex !== -1) {
        group[participantIndex] = {
          ...group[participantIndex],
          ...newValue,
        };

        if (isCollectionDoc) {
          const sanitized = JSON.parse(JSON.stringify(pairing));
          await setDoc(pairingRef, sanitized, { merge: true });
        } else {
          const userData = legacyUserDocSnap.data();
          const pairings = userData.pairings || [];
          pairings[legacyPairingIndex!] = pairing;
          await setDoc(pairingRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
        }

        console.log("Pairing updated successfully!");

        const isFull = group.every((p: any) => p.name && p.name.trim() !== "");

        try {
          const { createNotification } = await import("./notifications");
          await createNotification(
            userId,
            `${newValue.name} has filled a slot in ${groupingPurpose}`,
            "info",
            `/result?id=${pairing.id}`
          );
        } catch (notifyError) {
          console.error("Failed to notify organizer:", notifyError);
        }

        return { participants: group, isFull };
      }
    }
    return null;
  } catch (error) {
    console.error("Error updating pairing value:", error);
    return null;
  }
}

export async function addParticipantToSecretSanta(
  userId: string,
  eventId: string,
  participant: any
) {
  try {
    const { pairingRef, pairing, isCollectionDoc, legacyUserDocSnap, legacyPairingIndex } =
      await getPairingRefAndData(userId, eventId);

    const participants = pairing.participants || [];

    if (participant.email && participant.email.trim() !== "") {
      const emailLower = participant.email.trim().toLowerCase();
      const isDuplicate = participants.some(
        (p: any) => p.email && p.email.trim().toLowerCase() === emailLower
      );
      if (isDuplicate) {
        throw new Error("This email is already registered for this event.");
      }
    }

    pairing.participants = [...participants, participant];

    if (
      pairing.config?.expectedParticipants &&
      pairing.participants.length === pairing.config.expectedParticipants
    ) {
      try {
        const { functions } = await import("./firebase");
        const { httpsCallable } = await import("firebase/functions");
        const notifyGroupComplete = httpsCallable(functions, "notifyGroupComplete");
        await notifyGroupComplete({ eventId, ownerId: userId });
      } catch (err) {
        console.error("Failed to trigger notification:", err);
      }
    }

    try {
      const { createNotification } = await import("./notifications");
      await createNotification(
        userId,
        `${participant.name || "A new user"} joined ${
          pairing.groupingPurpose || pairing.title || "Secret Santa"
        }`,
        "info",
        `/result?id=${eventId}`
      );
    } catch (notifyError) {
      console.error("Failed to notify organizer:", notifyError);
    }

    if (isCollectionDoc) {
      await setDoc(pairingRef, JSON.parse(JSON.stringify(pairing)), { merge: true });
    } else {
      const userData = legacyUserDocSnap.data();
      const pairings = userData.pairings || [];
      pairings[legacyPairingIndex!] = pairing;
      await setDoc(pairingRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
    }

    console.log("Participant added successfully");
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
}

export async function generateSecretSantaPairs(
  userId: string,
  eventId: string
) {
  try {
    const { pairingRef, pairing, isCollectionDoc, legacyUserDocSnap, legacyPairingIndex } =
      await getPairingRefAndData(userId, eventId);

    const participants = pairing.participants || [];
    if (participants.length < 2) {
      throw new Error("Not enough participants to generate pairs");
    }

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const pairs = [];

    for (let i = 0; i < shuffled.length; i++) {
      const santa = shuffled[i];
      const receiver = shuffled[(i + 1) % shuffled.length];
      pairs.push({
        santaId: santa.id,
        receiverId: receiver.id,
      });
    }

    pairing.pairs = pairs;
    pairing.status = "locked";

    if (isCollectionDoc) {
      await setDoc(pairingRef, JSON.parse(JSON.stringify(pairing)), { merge: true });
    } else {
      const userData = legacyUserDocSnap.data();
      const pairings = userData.pairings || [];
      pairings[legacyPairingIndex!] = pairing;
      await setDoc(pairingRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
    }

    console.log("Pairs generated successfully");
    return pairing;
  } catch (error) {
    console.error("Error generating pairs:", error);
    throw error;
  }
}

export async function removeParticipantFromSecretSanta(
  userId: string,
  eventId: string,
  participantId: string
) {
  try {
    const { pairingRef, pairing, isCollectionDoc, legacyUserDocSnap, legacyPairingIndex } =
      await getPairingRefAndData(userId, eventId);

    if (pairing.participants) {
      pairing.participants = pairing.participants.filter(
        (p: any) => p.id !== participantId
      );

      if (isCollectionDoc) {
        await setDoc(pairingRef, JSON.parse(JSON.stringify(pairing)), { merge: true });
      } else {
        const userData = legacyUserDocSnap.data();
        const pairings = userData.pairings || [];
        pairings[legacyPairingIndex!] = pairing;
        await setDoc(pairingRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
      }
      console.log("Participant removed successfully");
    }
  } catch (error) {
    console.error("Error removing participant:", error);
    throw error;
  }
}

export async function addParticipantToRandomPositioning(
  userId: string,
  eventId: string,
  participant: any
) {
  try {
    const { pairingRef, pairing, isCollectionDoc, legacyUserDocSnap, legacyPairingIndex } =
      await getPairingRefAndData(userId, eventId);

    const participants = pairing.participants || [];

    if (participant.email && participant.email.trim() !== "") {
      const emailLower = participant.email.trim().toLowerCase();
      const isDuplicate = participants.some(
        (p: any) => p.email && p.email.trim().toLowerCase() === emailLower
      );
      if (isDuplicate) {
        throw new Error("This email is already registered for this event.");
      }
    }

    pairing.participants = [...participants, participant];

    try {
      const { createNotification } = await import("./notifications");
      await createNotification(
        userId,
        `${participant.name || "A new user"} joined ${
          pairing.groupingPurpose || pairing.title || "Random Positioning"
        }`,
        "info",
        `/result?id=${eventId}`
      );
    } catch (notifyError) {
      console.error("Failed to notify organizer:", notifyError);
    }

    if (isCollectionDoc) {
      await setDoc(pairingRef, JSON.parse(JSON.stringify(pairing)), { merge: true });
    } else {
      const userData = legacyUserDocSnap.data();
      const pairings = userData.pairings || [];
      pairings[legacyPairingIndex!] = pairing;
      await setDoc(pairingRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
    }

    console.log("Participant added successfully");
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
}

export async function generateRandomPositions(userId: string, eventId: string) {
  try {
    const { pairingRef, pairing, isCollectionDoc, legacyUserDocSnap, legacyPairingIndex } =
      await getPairingRefAndData(userId, eventId);

    const participants = pairing.participants || [];
    if (participants.length === 0) {
      throw new Error("No participants to generate positions for");
    }

    const numbers = Array.from(
      { length: participants.length },
      (_, i) => i + 1
    ).sort(() => Math.random() - 0.5);

    participants.forEach((p: any, index: number) => {
      p.assignedNumber = numbers[index];
    });

    pairing.participants = participants;
    pairing.status = "locked";

    if (isCollectionDoc) {
      await setDoc(pairingRef, JSON.parse(JSON.stringify(pairing)), { merge: true });
    } else {
      const userData = legacyUserDocSnap.data();
      const pairings = userData.pairings || [];
      pairings[legacyPairingIndex!] = pairing;
      await setDoc(pairingRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
    }

    console.log("Positions generated successfully");
    return pairing;
  } catch (error) {
    console.error("Error generating positions:", error);
    throw error;
  }
}

export async function removeParticipantFromRandomPositioning(
  userId: string,
  eventId: string,
  participantId: string
) {
  try {
    const { pairingRef, pairing, isCollectionDoc, legacyUserDocSnap, legacyPairingIndex } =
      await getPairingRefAndData(userId, eventId);

    if (pairing.participants) {
      pairing.participants = pairing.participants.filter(
        (p: any) => p.id !== participantId
      );

      if (isCollectionDoc) {
        await setDoc(pairingRef, JSON.parse(JSON.stringify(pairing)), { merge: true });
      } else {
        const userData = legacyUserDocSnap.data();
        const pairings = userData.pairings || [];
        pairings[legacyPairingIndex!] = pairing;
        await setDoc(pairingRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
      }
      console.log("Participant removed successfully");
    }
  } catch (error) {
    console.error("Error removing participant:", error);
    throw error;
  }
}

export async function closePairingEvent(userId: string, eventId: string) {
  try {
    const { pairingRef, pairing, isCollectionDoc, legacyUserDocSnap, legacyPairingIndex } =
      await getPairingRefAndData(userId, eventId);

    pairing.status = "locked";

    if (isCollectionDoc) {
      await setDoc(pairingRef, { status: "locked" }, { merge: true });
    } else {
      const userData = legacyUserDocSnap.data();
      const pairings = userData.pairings || [];
      pairings[legacyPairingIndex!] = pairing;
      await setDoc(pairingRef, { pairings: JSON.parse(JSON.stringify(pairings)) }, { merge: true });
    }

    console.log("Event closed successfully");
    return pairing;
  } catch (error) {
    console.error("Error closing event:", error);
    throw error;
  }
}

export async function deletePairingEvent(userId: string, eventId: string) {
  try {
    // Check Pairings collection
    const pairingRef = doc(db, "Pairings", eventId);
    const docSnap = await getDoc(pairingRef);
    if (docSnap.exists()) {
      await deleteDoc(pairingRef);
      console.log("Event deleted from Pairings collection successfully");
    }

    // Also remove from legacy user document if present
    if (userId) {
      const userRef = doc(db, "Users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const pairings = userData.pairings || [];
        const updatedPairings = pairings.filter((p: any) => p.id !== eventId);
        await setDoc(userRef, { pairings: JSON.parse(JSON.stringify(updatedPairings)) }, { merge: true });
      }
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

export async function duplicatePairingEvent(userId: string, eventId: string) {
  try {
    const { pairing } = await getPairingRefAndData(userId, eventId);

    const newId =
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);

    const clonedGroups = { ...pairing.groups };
    if (pairing.type === "role-based") {
      Object.keys(clonedGroups).forEach((key) => {
        clonedGroups[key] = (clonedGroups[key] || []).map((member: any) => ({
          ...member,
          name: "",
          email: "",
        }));
      });
    }

    const duplicatedPairing: any = {
      ...pairing,
      id: newId,
      ownerId: userId,
      groupingPurpose: `${pairing.groupingPurpose || pairing.title} (Copy)`,
      title: `${pairing.title || pairing.groupingPurpose} (Copy)`,
      createdAt: Date.now(),
      status: "open",
      groups: clonedGroups,
    };

    if (
      pairing.type === "secret-santa" ||
      pairing.type === "random-positioning"
    ) {
      duplicatedPairing.participants = [];
    }

    if (duplicatedPairing.pairs) {
      delete duplicatedPairing.pairs;
    }

    await addPairing(userId, duplicatedPairing);
    console.log("Event duplicated successfully into Pairings collection!");
    return duplicatedPairing;
  } catch (error) {
    console.error("Error duplicating event:", error);
    throw error;
  }
}
