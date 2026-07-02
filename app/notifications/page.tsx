"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from "../../src/services/notifications";
import { FaBullhorn, FaUsers, FaCheckCircle, FaBell } from "react-icons/fa";

// Time ago formatting helper
function formatTimeAgo(timestamp: any) {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 0) return "Just now";
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  // Fallback to formatted date
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Map notification message to specific icons, colors, and titles
interface NotificationStyle {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
}

const getNotificationStyle = (message: string): NotificationStyle => {
  const lowercase = message.toLowerCase();

  if (lowercase.includes("filled a slot") || lowercase.includes("joined")) {
    return {
      icon: <FaBullhorn className="w-5 h-5" />,
      iconBg: "bg-blue-50/80 border border-blue-100/50",
      iconColor: "text-[#1449b2]",
      title: "New participant joined your event",
    };
  }

  if (
    lowercase.includes("full capacity") ||
    lowercase.includes("all groups") ||
    lowercase.includes("complete")
  ) {
    return {
      icon: <FaUsers className="w-5 h-5" />,
      iconBg: "bg-orange-50/80 border border-orange-100/50",
      iconColor: "text-orange-500",
      title: "All Groups Filled!",
    };
  }

  // Default to event success / creation info
  return {
    icon: <FaCheckCircle className="w-5 h-5" />,
    iconBg: "bg-green-50/80 border border-green-100/50",
    iconColor: "text-green-500",
    title: "Event Created Successfully",
  };
};

const NotificationsContent = ({ user }: { user: any }) => {
  const router = useRouter();
  const userId = user?.uid || user?.userId || "";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(userId, (data) => {
      // Sort most recent first just in case Firestore didn't index yet
      const sorted = [...data].sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Date.now();
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Date.now();
        return timeB - timeA;
      });
      setNotifications(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await markAllNotificationsAsRead(userId);
  };

  const handleItemClick = async (n: Notification) => {
    if (!n.read) {
      await markNotificationAsRead(n.id);
    }
    if (n.link) {
      router.push(n.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 text-center py-6 text-black">
      {/* Page Header */}
      <div className="flex flex-col items-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight font-heading">
          Notifications
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Stay updated with your latest pairing and event activities
        </p>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="mt-3 text-xs font-bold text-[#1449b2] hover:underline cursor-pointer transition-all"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="flex flex-col gap-3 mt-4 text-left">
        {loading ? (
          <div className="flex justify-center items-center py-16 bg-white rounded-3xl border border-gray-150 shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1449b2]"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-150 p-12 text-center shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <FaBell className="w-6 h-6 text-blue-300 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">
              All caught up!
            </h3>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              You don't have any notifications at the moment. We'll alert you here when new participants join or events fill up.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {notifications.map((n) => {
              const style = getNotificationStyle(n.message);
              const timeString = formatTimeAgo(n.createdAt);

              return (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={`bg-white rounded-2xl border ${
                    !n.read ? "border-blue-100 shadow-sm bg-blue-50/5" : "border-gray-150"
                  } p-4.5 hover:translate-y-[-1px] hover:shadow-md transition-all duration-200 cursor-pointer flex gap-4 items-start relative group`}
                >
                  {/* Left: Icon circle */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${style.iconBg} ${style.iconColor}`}>
                    {style.icon}
                  </div>

                  {/* Center: Details */}
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="text-sm font-bold text-gray-900 leading-tight mb-1 truncate">
                      {style.title}
                    </h4>
                    <p className="text-xs text-gray-500 leading-normal font-medium">
                      {n.message}
                    </p>
                  </div>

                  {/* Right: Meta Timestamp */}
                  <div className="flex flex-col items-end gap-2 shrink-0 self-center">
                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                      {timeString}
                    </span>
                    {!n.read && (
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse-subtle" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const NotificationsPageContent = () => {
  return (
    <NextProtectedRoute>
      {(user) => <NotificationsContent user={user} />}
    </NextProtectedRoute>
  );
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 text-center text-gray-500 font-semibold">
        Loading notifications...
      </div>
    }>
      <NotificationsPageContent />
    </Suspense>
  );
}
