import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "./firebase";
import Auth from "./auth.module";

import { Pairing } from "../types";

// Removed local FormValues interface in favor of shared Pairing type

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
            const docRef = doc(db, "Users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUserDetails(docSnap.data());
              console.log("doc", docSnap.data());
              resolve();
            } else {
              console.log("No user data found in Firestore");
              setUserDetails(null);
              resolve();
            }
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
    const userRef = doc(db, "Users", userId);
    console.log("here");
    await updateDoc(userRef, {
      pairings: arrayUnion(pairingData),
    });
    console.log("Pairing added successfully!");
  } catch (error) {
    console.error("Error adding pairing:", error);
  }
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
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];

      // Find the pairing with the matching groupingPurpose
      const pairingIndex = pairings.findIndex(
        (p: any) => p.groupingPurpose === groupingPurpose
      );

      if (pairingIndex !== -1) {
        const pairing = pairings[pairingIndex];

        if (pairing.status === "locked") {
          throw new Error("This event is closed. No further registrations are allowed.");
        }

        const groups = pairing.groups;

        // Check if the group exists
        if (groups && groups[groupKey]) {
          const group = groups[groupKey];

          const participantIndex = group.findIndex((p: any) => p.id === id);

          if (participantIndex !== -1) {
            // Update the participant
            group[participantIndex] = {
              ...group[participantIndex],
              ...newValue,
            };

            // Update the pairings array in the local copy
            pairings[pairingIndex] = pairing;

            // Write back to Firestore
            await updateDoc(userRef, {
              pairings: pairings,
            });
            console.log("Pairing updated successfully!");

            // Check if group is full
            const isFull = group.every(
              (p: any) => p.name && p.name.trim() !== ""
            );

            // Notify organizer about new participant
            try {
              const { createNotification } = await import("./notifications");
              // pairing is defined in the outer scope
              const eventId = pairing.id;
              await createNotification(
                userId,
                `${newValue.name} has filled a slot in ${groupingPurpose}`,
                "info",
                `/result?id=${eventId}`
              );
            } catch (notifyError) {
              console.error("Failed to notifiy organizer:", notifyError);
            }

            return { participants: group, isFull };
          } else {
            console.error("Participant not found in group.");
            return null;
          }
        } else {
          console.error("Group not found.");
          return null;
        }
      } else {
        console.error("Pairing with grouping purpose not found.");
        return null;
      }
    } else {
      console.error("User document not found.");
      return null;
    }
  } catch (error) {
    console.error("Error updating pairing value:", error);
    return null;
  }
}

// export async function editPairingValue(
//   userId: string,
//   groupingPurpose: string,
//   groupKey: string,
//   keyIndex: number,
//   id: string,
//   newValue: { name: string; track: string; email: string }
// ) {
//   try {
//     const userRef = doc(db, "Users", userId);
//     const docSnap = await getDoc(userRef);
//     if (!docSnap.exists()) {
//       console.log("No user data found.");
//       return;
//     }

//     const data = docSnap.data();
//     if (!data || !data.pairings || !data.pairings[groupingPurpose] || !data.pairings[groupingPurpose][groupKey] || !Array.isArray(data.pairings[groupingPurpose][groupKey])) {
//       console.log("Pairings data not found.");
//       return;
//     }

//     const currentGroups = data.pairings[groupingPurpose][groupKey];
//     const groupIndex = currentGroups.findIndex((group: { id: string }) => group.id === id);

//     if (groupIndex === -1) {
//       console.log("Group with specified ID not found.");
//       return;
//     }

//     const updatedGroups = currentGroups.filter((group: { id: string }) => group.id !== id);
//     updatedGroups.splice(groupIndex, 0, { ...newValue, id });
// const par=`pairings.${groupingPurpose}.${groupKey}`
// console.log({par})
//     await updateDoc(userRef, {
//       [`pairings.${groupingPurpose}.${groupKey}`]: updatedGroups,
//     });

//     console.log("Pairing updated successfully!");
//   } catch (error) {
//     console.error("Error updating pairing value:", error);
//   }
// }
// ... existing file content

export async function addParticipantToSecretSanta(
  userId: string,
  eventId: string,
  participant: any
) {
  try {
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];
      const pairingIndex = pairings.findIndex((p: any) => p.id === eventId);

      if (pairingIndex !== -1) {
        const pairing = pairings[pairingIndex];
        if (!pairing.participants) {
          pairing.participants = [];
        }
        pairing.participants.push(participant);
        pairings[pairingIndex] = pairing;

        if (
          pairing.config?.expectedParticipants &&
          pairing.participants.length === pairing.config.expectedParticipants
        ) {
          console.log("Group full! Triggering notification...");
          // ... existing cloud function trigger ...
          try {
            const { functions } = await import("./firebase");
            const { httpsCallable } = await import("firebase/functions");
            const notifyGroupComplete = httpsCallable(
              functions,
              "notifyGroupComplete"
            );
            await notifyGroupComplete({ eventId: eventId, ownerId: userId });
            console.log("Notification trigger sent.");
          } catch (err) {
            console.error("Failed to trigger notification:", err);
            // Don't block the actual join if notification fails
          }
        }

        // Notify organizer about new participant
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

        await updateDoc(userRef, { pairings });
        console.log("Participant added successfully");
      } else {
        throw new Error("Event not found");
      }
    } else {
      throw new Error("Organizer not found");
    }
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
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];
      const pairingIndex = pairings.findIndex((p: any) => p.id === eventId);

      if (pairingIndex !== -1) {
        const pairing = pairings[pairingIndex];
        const participants = pairing.participants || [];

        if (participants.length < 2) {
          throw new Error("Not enough participants to generate pairs");
        }

        // Shuffle participants
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
        pairing.status = "locked"; // Lock the event
        pairings[pairingIndex] = pairing;

        await updateDoc(userRef, { pairings });
        console.log("Pairs generated successfully");
        return pairing;
      } else {
        throw new Error("Event not found");
      }
    }
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
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];
      const pairingIndex = pairings.findIndex((p: any) => p.id === eventId);

      if (pairingIndex !== -1) {
        const pairing = pairings[pairingIndex];
        if (pairing.participants) {
          pairing.participants = pairing.participants.filter(
            (p: any) => p.id !== participantId
          );
          pairings[pairingIndex] = pairing;

          await updateDoc(userRef, { pairings });
          console.log("Participant removed successfully");
        }
      } else {
        throw new Error("Event not found");
      }
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
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];
      const pairingIndex = pairings.findIndex((p: any) => p.id === eventId);

      if (pairingIndex !== -1) {
        const pairing = pairings[pairingIndex];
        if (!pairing.participants) {
          pairing.participants = [];
        }
        pairing.participants.push(participant);
        pairings[pairingIndex] = pairing;

        await updateDoc(userRef, { pairings });
        console.log("Participant added successfully");

        // Notify organizer about new participant
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
      } else {
        throw new Error("Event not found");
      }
    } else {
      throw new Error("Organizer not found");
    }
  } catch (error) {
    console.error("Error adding participant:", error);
    throw error;
  }
}

export async function generateRandomPositions(userId: string, eventId: string) {
  try {
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];
      const pairingIndex = pairings.findIndex((p: any) => p.id === eventId);

      if (pairingIndex !== -1) {
        const pairing = pairings[pairingIndex];
        const participants = pairing.participants || [];

        if (participants.length === 0) {
          throw new Error("No participants to generate positions for");
        }

        // Shuffle participants

        // Assign distinct numbers
        // We actually want 1 to N.
        // Let's just shuffle the participants array order and assign index+1?
        // No, 'participants' usually is append-only for join order log.
        // We should just assign the 'assignedNumber' field.

        // Shuffle an array of numbers 1..N
        const numbers = Array.from(
          { length: participants.length },
          (_, i) => i + 1
        ).sort(() => Math.random() - 0.5);

        participants.forEach((p: any, index: number) => {
          p.assignedNumber = numbers[index];
        });

        pairing.participants = participants;
        pairing.status = "locked"; // Lock the event
        pairings[pairingIndex] = pairing;

        await updateDoc(userRef, { pairings });
        console.log("Positions generated successfully");
        return pairing;
      } else {
        throw new Error("Event not found");
      }
    }
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
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];
      const pairingIndex = pairings.findIndex((p: any) => p.id === eventId);

      if (pairingIndex !== -1) {
        const pairing = pairings[pairingIndex];
        if (pairing.participants) {
          // Check if locked? Usually organizer can remove, but if locked, re-shuffle needed?
          // For now allow remove, but warn in UI. Backend just suppresses it.
          pairing.participants = pairing.participants.filter(
            (p: any) => p.id !== participantId
          );
          pairings[pairingIndex] = pairing;

          await updateDoc(userRef, { pairings });
          console.log("Participant removed successfully");
        }
      } else {
        throw new Error("Event not found");
      }
    }
  } catch (error) {
    console.error("Error removing participant:", error);
    throw error;
  }
}

export async function closePairingEvent(userId: string, eventId: string) {
  try {
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];
      const pairingIndex = pairings.findIndex((p: any) => p.id === eventId);

      if (pairingIndex !== -1) {
        pairings[pairingIndex].status = "locked";
        await updateDoc(userRef, { pairings });
        console.log("Event closed successfully");
        return pairings[pairingIndex];
      } else {
        throw new Error("Event not found");
      }
    } else {
      throw new Error("User document not found");
    }
  } catch (error) {
    console.error("Error closing event:", error);
    throw error;
  }
}

export async function deletePairingEvent(userId: string, eventId: string) {
  try {
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];
      const updatedPairings = pairings.filter((p: any) => p.id !== eventId);

      await updateDoc(userRef, { pairings: updatedPairings });
      console.log("Event deleted successfully");
      return updatedPairings;
    } else {
      throw new Error("User document not found");
    }
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

export async function duplicatePairingEvent(userId: string, eventId: string) {
  try {
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      const pairings = userData.pairings || [];
      const pairingToDuplicate = pairings.find((p: any) => p.id === eventId);

      if (pairingToDuplicate) {
        const newId = typeof crypto?.randomUUID === "function" 
          ? crypto.randomUUID() 
          : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        
        // Reset claimed slots for role-based events
        const clonedGroups = { ...pairingToDuplicate.groups };
        if (pairingToDuplicate.type === "role-based") {
          Object.keys(clonedGroups).forEach((key) => {
            clonedGroups[key] = clonedGroups[key].map((member: any) => ({
              ...member,
              name: "",
              email: "",
            }));
          });
        }
        
        const duplicatedPairing = {
          ...pairingToDuplicate,
          id: newId,
          groupingPurpose: `${pairingToDuplicate.groupingPurpose} (Copy)`,
          title: `${pairingToDuplicate.title} (Copy)`,
          createdAt: Date.now(),
          status: "open",
          participants: pairingToDuplicate.type === "secret-santa" || pairingToDuplicate.type === "random-positioning" ? [] : pairingToDuplicate.participants,
          groups: clonedGroups,
        };
        
        if (duplicatedPairing.pairs) {
          delete duplicatedPairing.pairs;
        }

        const updatedPairings = [...pairings, duplicatedPairing];
        await updateDoc(userRef, { pairings: updatedPairings });
        console.log("Event duplicated successfully");
        return duplicatedPairing;
      } else {
        throw new Error("Event not found");
      }
    } else {
      throw new Error("User document not found");
    }
  } catch (error) {
    console.error("Error duplicating event:", error);
    throw error;
  }
}
