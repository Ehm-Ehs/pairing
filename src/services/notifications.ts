import { toDate, type TimeLike } from "../utils/timeUtils";
import { logger } from "@/utils/logger";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  readAt?: TimeLike;
  createdAt: TimeLike;
  link?: string;
}

// Notifications are created by the server (see src/server/events.ts); the browser only reads and marks them.

/**
 * Live list of a user's notifications, newest first.
 *
 * Sorting happens here instead of in the query. A query that filters by user and orders by
 * time needs a composite index created by hand in every Firebase project; a user's list is
 * small, so sorting in the browser avoids that setup step entirely.
 */
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(collection(db, "Notifications"), where("userId", "==", userId));
  // A notification whose server timestamp has not arrived yet counts as "now".
  const time = (n: Notification) => toDate(n.createdAt)?.getTime() ?? Date.now();

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Notification[];
      callback(notifications.sort((a, b) => time(b) - time(a)));
    },
    (error) => {
      logger.error("Error subscribing to notifications:", error);
    }
  );
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, "Notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });
  } catch (error) {
    logger.error("Error marking notification as read:", error);
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, "Notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, {
        read: true,
        readAt: serverTimestamp(),
      });
    });
    await batch.commit();
    logger.debug("All notifications marked as read!");
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
  }
};
