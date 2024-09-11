import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import Auth from "./auth.module";

export interface FormValues {
  numParticipants: string;
  numGroups: string;
  characteristics: { name: string; count: string }[];
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


// export async function editPairingValue(
//   userId: string,
//   groupingPurpose: string,
//   groupKey:string,
//   keyIndex:number,
//   id:string,
//   newValue: {  name: string; track: string; email: string }
// ) {
//   try {

//     const userRef = doc(db, "Users", userId);
//     console.log("triggered")

//     console.log('userRef:', userRef);

//     const pairingPath = `pairings.${groupingPurpose}.${groupKey}.${keyIndex}.${id}`;
//     console.log('pairingPath:', pairingPath);

//     // await updateDoc(userRef, {
//     //   [`pairings.${groupingPurpose}.${groupKey}.${keyIndex}.${id}`]: arrayUnion(newValue),
//     // });
//     console.log('Update successful');
//   } catch (error) {
//     console.log("Error updating pairing value:", error);
//   }
// }




export async function editPairingValue(
  userId: string,
  groupingPurpose: string,
  groupKey: string,
  keyIndex: number,
  id: string,
  newValue: { name: string; track: string; email: string }
) {
  try {
    const userRef = doc(db, "Users", userId);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) {
      console.log("No user data found.");
      return;
    }

    const data = docSnap.data();
    if (!data || !data.pairings || !data.pairings[groupingPurpose] || !data.pairings[groupingPurpose][groupKey] || !Array.isArray(data.pairings[groupingPurpose][groupKey])) {
      console.log("Pairings data not found.");
      return;
    }

    const currentGroups = data.pairings[groupingPurpose][groupKey];
    const groupIndex = currentGroups.findIndex((group: { id: string }) => group.id === id);

    if (groupIndex === -1) {
      console.log("Group with specified ID not found.");
      return;
    }

    const updatedGroups = currentGroups.filter((group: { id: string }) => group.id !== id);
    updatedGroups.splice(groupIndex, 0, { ...newValue, id });
const par=`pairings.${groupingPurpose}.${groupKey}`
console.log({par})
    await updateDoc(userRef, {
      [`pairings.${groupingPurpose}.${groupKey}`]: updatedGroups,
    });

    console.log("Pairing updated successfully!");
  } catch (error) {
    console.error("Error updating pairing value:", error);
  }
}