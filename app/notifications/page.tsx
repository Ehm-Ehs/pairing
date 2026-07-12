"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from "../../src/services/notifications";

// ─── Time helpers ─────────────────────────────────────────────────────────────
function formatTimeAgo(timestamp: any): string {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getGroupLabel(timestamp: any): string {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return "Older";
}

// ─── Notification config ──────────────────────────────────────────────────────
interface NotifConfig {
  emoji: string;
  gradient: string;
  ring: string;
  dot: string;
  label: string;
  title: string;
}

const getNotifConfig = (message: string): NotifConfig => {
  const lc = message.toLowerCase();
  if (lc.includes("joined") || lc.includes("filled a slot")) {
    return {
      emoji: "👤",
      gradient: "from-blue-500/20 to-indigo-500/10",
      ring: "border-blue-200",
      dot: "bg-blue-500",
      label: "New Participant",
      title: "New participant joined your event",
    };
  }
  if (lc.includes("full capacity") || lc.includes("all groups") || lc.includes("complete")) {
    return {
      emoji: "🎉",
      gradient: "from-amber-500/20 to-orange-400/10",
      ring: "border-amber-200",
      dot: "bg-amber-500",
      label: "Event Full",
      title: "All Groups Filled!",
    };
  }
  if (lc.includes("closed") || lc.includes("locked")) {
    return {
      emoji: "🔒",
      gradient: "from-rose-500/20 to-pink-400/10",
      ring: "border-rose-200",
      dot: "bg-rose-500",
      label: "Event Closed",
      title: "Event has been closed",
    };
  }
  if (lc.includes("created") || lc.includes("live")) {
    return {
      emoji: "✅",
      gradient: "from-emerald-500/20 to-teal-400/10",
      ring: "border-emerald-200",
      dot: "bg-emerald-500",
      label: "Event Created",
      title: "Event Created Successfully",
    };
  }
  return {
    emoji: "🔔",
    gradient: "from-violet-500/20 to-purple-400/10",
    ring: "border-violet-200",
    dot: "bg-violet-500",
    label: "Update",
    title: "New Notification",
  };
};

// ─── Filter tab types ─────────────────────────────────────────────────────────
type FilterTab = "all" | "unread" | "read";

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 flex gap-4 items-start animate-pulse">
    <div className="w-12 h-12 rounded-2xl bg-gray-100 shrink-0" />
    <div className="flex-1 flex flex-col gap-2 pt-1">
      <div className="h-3.5 bg-gray-100 rounded-full w-3/5" />
      <div className="h-3 bg-gray-100 rounded-full w-4/5" />
      <div className="h-3 bg-gray-100 rounded-full w-2/5" />
    </div>
    <div className="w-12 h-3 bg-gray-100 rounded-full mt-1 shrink-0" />
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ filter }: { filter: FilterTab }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
    <div className="relative mb-6">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center shadow-sm">
        <span className="text-4xl">{filter === "unread" ? "✨" : "🔔"}</span>
      </div>
      <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold">✓</span>
    </div>
    <h3 className="text-xl font-extrabold text-gray-900 mb-2 tracking-tight">
      {filter === "unread" ? "All caught up!" : filter === "read" ? "No read notifications" : "No notifications yet"}
    </h3>
    <p className="text-sm text-gray-400 max-w-xs leading-relaxed font-medium">
      {filter === "unread"
        ? "You've read all your notifications. We'll let you know when something new happens."
        : filter === "read"
          ? "You haven't read any notifications yet — new ones will appear here."
          : "We'll alert you here when participants join or events fill up."}
    </p>
  </div>
);

// ─── Single notification card ─────────────────────────────────────────────────
const NotifCard = ({
  n,
  onClick,
}: {
  n: Notification;
  onClick: (n: Notification) => void;
}) => {
  const cfg = getNotifConfig(n.message);

  return (
    <div
      onClick={() => onClick(n)}
      className={`group relative flex gap-4 items-start p-4 rounded-2xl border cursor-pointer transition-all duration-200
        hover:shadow-md hover:-translate-y-[1px] select-none
        ${!n.read
          ? "bg-white border-gray-100 shadow-sm"
          : "bg-gray-50/60 border-gray-100/80"
        }`}
    >
      {/* Unread accent bar */}
      {!n.read && (
        <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
      )}

      {/* Icon bubble */}
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${cfg.gradient} border ${cfg.ring} flex items-center justify-center text-xl shrink-0 shadow-sm`}>
        {cfg.emoji}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {cfg.label}
          </span>
          {!n.read && (
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
          )}
        </div>
        <h4 className={`text-sm font-bold leading-snug mb-1 ${!n.read ? "text-gray-900" : "text-gray-600"}`}>
          {cfg.title}
        </h4>
        <p className="text-xs text-gray-400 leading-relaxed font-medium line-clamp-2">
          {n.message}
        </p>
      </div>

      {/* Timestamp */}
      <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
        <span className="text-[10px] font-bold text-gray-300 whitespace-nowrap">
          {formatTimeAgo(n.createdAt)}
        </span>
        {n.link && (
          <span className="text-[9px] font-bold text-blue-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">
            View →
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Main content component ───────────────────────────────────────────────────
const NotificationsContent = ({ user }: { user: any }) => {
  const router = useRouter();
  const userId = user?.uid || user?.userId || "";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToNotifications(userId, (data) => {
      const sorted = [...data].sort((a, b) => {
        const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : Date.now();
        const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : Date.now();
        return tB - tA;
      });
      setNotifications(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filtered = useMemo(() => {
    if (activeTab === "unread") return notifications.filter((n) => !n.read);
    if (activeTab === "read") return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, activeTab]);

  // Group notifications by day
  const groups = useMemo(() => {
    const map: Record<string, Notification[]> = {};
    filtered.forEach((n) => {
      const label = getGroupLabel(n.createdAt);
      if (!map[label]) map[label] = [];
      map[label].push(n);
    });
    // Return in order: Today → Yesterday → This Week → Older
    const order = ["Today", "Yesterday", "This Week", "Older"];
    return order.filter((k) => map[k]).map((k) => ({ label: k, items: map[k] }));
  }, [filtered]);

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await markAllNotificationsAsRead(userId);
  };

  const handleItemClick = async (n: Notification) => {
    if (!n.read) await markNotificationAsRead(n.id);
    if (n.link) router.push(n.link);
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "read", label: "Read" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Hero header */}
      <div className="relative overflow-hidden  px-6 py-12 ">
        {/* Background blobs */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-2xl mx-auto relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">

                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 bg-rose-500 text-white text-[11px] font-bold rounded-full shadow-lg animate-bounce-subtle">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-1">
                Notifications
              </h1>
              <p className="text-[#1449b2] text-sm font-medium">
                Stay updated with your event activity
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-full transition-all backdrop-blur-sm cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Summary pills */}
          <div className="flex gap-3 mt-6 flex-wrap">
            <div className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
              {notifications.length} total
            </div>
            <div className="px-3 py-1.5 bg-rose-500/30 border border-rose-400/30 rounded-full text-xs font-bold backdrop-blur-sm">
              {unreadCount} unread
            </div>
            <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold backdrop-blur-sm">
              {notifications.length - unreadCount} read
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="max-w-2xl mx-auto px-4 -mt-5 relative z-10 mb-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-1.5 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.key
                ? "bg-gradient-to-r from-[#1449b2] to-[#1d6cdb] text-white shadow-md"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
            >
              {tab.label}
              {tab.key === "unread" && unreadCount > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === "unread" ? "bg-white/20 text-white" : "bg-rose-100 text-rose-600"}`}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notification list */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm">
            <EmptyState filter={activeTab} />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(({ label, items }) => (
              <div key={label}>
                {/* Group label */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
                    {label}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-[10px] font-bold text-gray-300">
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2">
                  {items.map((n) => (
                    <NotifCard key={n.id} n={n} onClick={handleItemClick} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Page shell ───────────────────────────────────────────────────────────────
const NotificationsPageContent = () => (
  <NextProtectedRoute>
    {(user) => <NotificationsContent user={user} />}
  </NextProtectedRoute>
);

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-200 border-t-[#1449b2]" />
            <p className="text-sm font-bold text-gray-400">Loading notifications…</p>
          </div>
        </div>
      }
    >
      <NotificationsPageContent />
    </Suspense>
  );
}
