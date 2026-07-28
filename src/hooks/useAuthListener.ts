import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { GroupingsPageProps, Pairing } from "../types";

export const useAuthListener = () => {
  const [user, setUser] = useState<GroupingsPageProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribePairings: (() => void) | undefined;

    let latestUserData: any = null;
    let latestCollectionPairings: Pairing[] = [];

    const combineData = () => {
      if (!latestUserData) {
        setUser(null);
        return;
      }

      const legacyPairings: Pairing[] = latestUserData.pairings || [];
      const mergedMap = new Map<string, Pairing>();
      legacyPairings.forEach((p) => {
        if (p && p.id) mergedMap.set(p.id, p);
      });
      latestCollectionPairings.forEach((p) => {
        if (p && p.id) mergedMap.set(p.id, p);
      });

      const allPairings = Array.from(mergedMap.values()).sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
      );

      setUser({
        ...latestUserData,
        userId: latestUserData.uid || latestUserData.id,
        pairings: allPairings,
      });
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribePairings) unsubscribePairings();

      if (currentUser) {
        // 1. Listen to Users/{uid}
        const userDocRef = doc(db, "Users", currentUser.uid);
        unsubscribeUser = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              latestUserData = {
                ...(docSnap.data() as GroupingsPageProps),
                uid: docSnap.id,
                userId: docSnap.id,
              };
            } else {
              latestUserData = {
                uid: currentUser.uid,
                userId: currentUser.uid,
                firstName: currentUser.displayName || "",
                email: currentUser.email || "",
                pairings: [],
              };
            }
            combineData();
            setLoading(false);
          },
          (error) => {
            console.error("Error listening to user document:", error);
            setLoading(false);
          }
        );

        // 2. Listen to Pairings collection where ownerId == currentUser.uid
        try {
          const pairingsQuery = query(
            collection(db, "Pairings"),
            where("ownerId", "==", currentUser.uid)
          );
          unsubscribePairings = onSnapshot(
            pairingsQuery,
            (snapshot) => {
              latestCollectionPairings = snapshot.docs.map(
                (d) => d.data() as Pairing
              );
              combineData();
            },
            (error) => {
              console.warn("Error listening to Pairings collection:", error);
            }
          );
        } catch (e) {
          console.warn("Pairings collection snapshot failed:", e);
        }
      } else {
        latestUserData = null;
        latestCollectionPairings = [];
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribePairings) unsubscribePairings();
    };
  }, []);

  return { user, loading };
};
