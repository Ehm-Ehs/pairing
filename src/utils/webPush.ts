import { errorMessage } from "@/utils/errors";
import { logger } from "@/utils/logger";
// Web Push API Helper Utilities for PairForm PWA

// Convert VAPID public key string to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if Push Notifications are supported in browser
function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Get current notification permission state
// Request permission and subscribe user to Web Push API
export async function subscribeUserToPush(): Promise<{
  success: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!isPushNotificationSupported()) {
    return { success: false, error: "Push notifications are not supported in this browser." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission was denied." };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicVapidKey) {
        logger.warn("No VAPID public key provided in environment variables.");
        return { success: false, error: "VAPID public key is missing." };
      }

      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    // Send subscription payload to backend API
    // The server links the subscription to the signed-in user from their session.
    const { apiFetch } = await import("../services/api");
    await apiFetch("/api/notifications/subscribe", {
      body: { subscription: subscription.toJSON(), userAgent: navigator.userAgent },
    });

    return { success: true, subscription };
  } catch (error) {
    logger.error("Failed to subscribe user to Web Push:", error);
    return { success: false, error: errorMessage(error) || "Failed to subscribe to notifications." };
  }
}
