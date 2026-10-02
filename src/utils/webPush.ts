// Web Push API Helper Utilities for PairForm PWA

// Convert VAPID public key string to Uint8Array
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
export function isPushNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

// Get current notification permission state
export function getNotificationPermissionState(): NotificationPermission {
  if (typeof window !== "undefined" && "Notification" in window) {
    return Notification.permission;
  }
  return "denied";
}

// Request permission and subscribe user to Web Push API
export async function subscribeUserToPush(userId?: string): Promise<{
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
      const isDevelopEnv = () => {
        if (typeof window !== "undefined") {
          const host = window.location.hostname.toLowerCase();
          if (
            host.includes("develop") ||
            host.includes("localhost")
          ) {
            return true;
          }
        }
        return process.env.NEXT_PUBLIC_APP_ENV === "develop" || process.env.NODE_ENV === "development";
      };

      const isDev = isDevelopEnv();
      const publicVapidKey = (isDev && process.env.NEXT_PUBLIC_VAPID_DEVELOP_PUBLIC_KEY)
        ? process.env.NEXT_PUBLIC_VAPID_DEVELOP_PUBLIC_KEY
        : process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicVapidKey) {
        console.warn("No VAPID public key provided in environment variables.");
        return { success: false, error: "VAPID public key is missing." };
      }

      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as BufferSource,
      });
    }

    // Send subscription payload to backend API
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: userId || null,
        userAgent: navigator.userAgent,
      }),
    });

    return { success: true, subscription };
  } catch (error: any) {
    console.error("Failed to subscribe user to Web Push:", error);
    return { success: false, error: error.message || "Failed to subscribe to notifications." };
  }
}
