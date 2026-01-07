import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: any;
  link?: string;
}

export const createNotification = async (
  userId: string,
  message: string,
  type: "info" | "success" | "warning" | "error" = "info",
  link?: string
) => {
  try {
    await addDoc(collection(db, "Notifications"), {
      userId,
      message,
      type,
      read: false,
      createdAt: serverTimestamp(),
      link,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  const q = query(
    collection(db, "Notifications"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      callback(notifications);
    },
    (error) => {
      console.error("Error subscribing to notifications:", error);
    }
  );
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, "Notifications", notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

export const markAllNotificationsAsRead = async (userId: string) => {};
