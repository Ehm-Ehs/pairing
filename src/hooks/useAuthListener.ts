import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, DocumentSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { GroupingsPageProps } from "../types";

export const useAuthListener = () => {
  const [user, setUser] = useState<GroupingsPageProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        const docRef = doc(db, "Users", currentUser.uid);
        unsubscribeSnapshot = onSnapshot(
          docRef,
          (docSnap: DocumentSnapshot) => {
            if (docSnap.exists()) {
              setUser({
                ...(docSnap.data() as GroupingsPageProps),
                userId: docSnap.id,
                uid: docSnap.id,
              });
            } else {
              setUser(null);
            }
            setLoading(false);
          },
          (error: Error) => {
            console.error("Error fetching user data:", error);
            setUser(null);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setLoading(false);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  return { user, loading };
};
