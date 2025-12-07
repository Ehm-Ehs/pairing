import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { auth, db } from "./firebase";
import Auth from "./auth.module";

export interface FormValues {
  numParticipants: string;
  numGroups: string;
  characteristics: { name: string; count: string }[];
  characteristicsLabel?: string;
  groups: {
    [key: number]: {
      id: string;
      number: number;
    }[];
  };
}

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

export async function addPairing(userId: string, pairingData: FormValues) {
  try {
    const userRef = doc(db, "Users", userId);
    console.log("here");
    const response = updateDoc(userRef, {
      pairings: arrayUnion(pairingData),
    });
    console.log({ response });
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
        const groups = pairing.groups;

        // Check if the group exists
        if (groups && groups[groupKey]) {
          const group = groups[groupKey];

          // Find the participant in the group
          // We can use keyIndex if it corresponds to the array index,
          // but checking ID is safer if the array order might have changed (though unlikely if we just read it)
          // Let's use the ID to be sure, or keyIndex if ID check fails/is redundant.
          // The previous logic passed keyIndex which was found via findIndex.

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
          } else {
            console.error("Participant not found in group.");
          }
        } else {
          console.error("Group not found.");
        }
      } else {
        console.error("Pairing with grouping purpose not found.");
      }
    } else {
      console.error("User document not found.");
    }
  } catch (error) {
    console.error("Error updating pairing value:", error);
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
