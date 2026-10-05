import { logger } from "@/utils/logger";
import { useState, useEffect } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import Auth from "../services/auth.module";
import { completeSignIn } from "../services/session";
import { GroupingsPageProps, Pairing } from "../types";

const SETUP_KEY = "pairform_account_ready";

/**
 * Makes sure the server has finished setting up this account: profile, token ledger and
 * any events still in the old format. Accounts created before those existed are repaired
 * here. Runs once per browser session; the server call itself is safe to repeat.
 */
function ensureAccountSetup(user: User) {
  try {
    if (sessionStorage.getItem(SETUP_KEY) === user.uid) return;
    sessionStorage.setItem(SETUP_KEY, user.uid);
  } catch {
    // No session storage: fall through and run it.
  }
  completeSignIn(user).catch((err) => {
    logger.error("Could not finish account setup:", err);
    try {
      sessionStorage.removeItem(SETUP_KEY); // try again on the next page load
    } catch {
      // ignore
    }
  });
}

/**
 * Live view of the signed-in user: their profile plus the events they own personally.
 * Firebase Auth is the only source of truth for the session.
 */
export const useAuthListener = () => {
  const [user, setUser] = useState<GroupingsPageProps | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined;
    let unsubscribePairings: (() => void) | undefined;

    let profile: (Omit<GroupingsPageProps, "pairings" | "userId"> & { uid: string }) | null = null;
    let pairings: Pairing[] = [];

    const publish = () => {
      if (!profile) {
        setUser(null);
        return;
      }
      setUser({
        ...profile,
        userId: profile.uid,
        pairings: [...pairings].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
      });
    };

    const stop = () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribePairings) unsubscribePairings();
    };

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      stop();

      if (!currentUser) {
        profile = null;
        pairings = [];
        Auth.deAuthenticateUser();
        setUser(null);
        setLoading(false);
        return;
      }

      ensureAccountSetup(currentUser);

      unsubscribeUser = onSnapshot(
        doc(db, "Users", currentUser.uid),
        (docSnap) => {
          const data = docSnap.exists() ? (docSnap.data() as Partial<GroupingsPageProps>) : null;

          profile = {
            firstName: currentUser.displayName || "",
            lastName: "",
            email: currentUser.email || "",
            ...data,
            uid: docSnap.id,
          };
          publish();
          setLoading(false);
        },
        (error) => {
          logger.error("Error listening to user document:", error);
          setLoading(false);
        }
      );

      unsubscribePairings = onSnapshot(
        query(collection(db, "Pairings"), where("ownerId", "==", currentUser.uid)),
        (snapshot) => {
          pairings = snapshot.docs.map((d) => d.data() as Pairing);
          publish();
        },
        (error) => logger.warn("Error listening to Pairings collection:", error)
      );
    });

    return () => {
      unsubscribeAuth();
      stop();
    };
  }, []);

  return { user, loading };
};
