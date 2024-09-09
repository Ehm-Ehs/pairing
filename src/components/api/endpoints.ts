import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import Auth from "./auth.module";

export interface FormValues {
  numParticipants: string;
  numGroups: string;
  pairings: {
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
              resolve(); // Resolve the promise when user data is set
            } else {
              console.log("No user data found in Firestore");
              setUserDetails(null); // Set user details to null when no data is found
              resolve(); // Resolve the promise
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            reject(error); // Reject the promise on error
          }
        } else {
          console.log("No user is logged in");
          setUserDetails(null); // Set user details to null when no user is logged in
          resolve(); // Resolve the promise
        }
      });
    } else {
      console.log("User is not authenticated");
      setUserDetails(null); // Set user details to null if not authenticated
      resolve(); // Resolve the promise
    }
  });
};

// Add a new employee
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
  pairingIndex: number,
  pairingsIndex: number,
  newValue: { id: string; name: string; track: string; email: string }
) {
  try {
    const userRef = doc(db, "Users", userId);
    console.log('userRef:', userRef);

    const pairingPath = `pairings.${groupingPurpose}.pairings.${pairingsIndex}.${pairingIndex}`;
    console.log('pairingPath:', pairingPath);

    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      console.log('Document data:', data);
    } else {
      console.log('Document does not exist');
    }

    await updateDoc(userRef, {
      [`pairings.${groupingPurpose}.pairings.${pairingsIndex}.${pairingIndex}`]: arrayUnion(newValue),
    });
    console.log('Update successful');
  } catch (error) {
    console.error("Error updating pairing value:", error);
  }
}
