import React, { useEffect, useState, useRef } from "react";
import {
  FaBell,
  FaCheckCircle,
  FaInfoCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import { FiBell } from "react-icons/fi";
import Link from "next/link";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification,
} from "../../services/notifications";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "./avatar";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotificationDropdownProps {
  userId: string;
  displayMode?: "dropdown" | "modal" | "inline";
  onClose?: () => void;
  showHeader?: boolean;
  showFooter?: boolean;
  position?: "right" | "sidebar";
  customTrigger?: (onClick: () => void, unreadCount: number) => React.ReactNode;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  userId,
  displayMode = "dropdown",
  onClose,
  showHeader = true,
  showFooter,
  position = "sidebar",
  customTrigger,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  // Open state is only relevant for dropdown/modal trigger mode.
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(userId, (data) => {
      const now = new Date();
      const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

      const filteredNotifications = data.filter((n) => {
        if (!n.read) return true; // Keep unread
        if (!n.readAt) return true; // Keep if read but no timestamp (legacy or just happened)

        // Check if read more than 3 days ago
        const readDate = n.readAt.seconds
          ? new Date(n.readAt.seconds * 1000)
          : new Date(); // Fallback if local serverTimestamp hasn't synced
        const timeSinceRead = now.getTime() - readDate.getTime();

        return timeSinceRead < threeDaysInMs;
      });

      setNotifications(filteredNotifications);
    });

    // Close dropdown when clicking outside (Only for trigger mode)
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        displayMode === "dropdown"
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userId, displayMode]);

  // Mark all as read when opened
  useEffect(() => {
    if (!isOpen || !userId) return;

    // Start a 2-second timer to mark all as read
    const timer = setTimeout(() => {
      markAllNotificationsAsRead(userId);
    }, 2000);

    return () => {
      clearTimeout(timer);
      // Ensure they are marked as read immediately when closed or unmounted
      markAllNotificationsAsRead(userId);
    };
  }, [isOpen, userId]);

  const unreadCount = isOpen ? 0 : notifications.filter((n) => !n.read).length;
  const unreadNotifications = notifications.filter((n) => !n.read);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const toggleOpen = () => {
    if (displayMode === "inline") return;
    setIsOpen(!isOpen);
  };

  // Determine if footer should be shown
  const shouldShowFooter =
    showFooter !== undefined ? showFooter : displayMode === "dropdown";

  // Render content function
  const renderContent = () => (
    <div
      className={cn(
        "bg-white flex flex-col overflow-hidden",
        displayMode === "inline"
          ? "w-full h-full"
          : "rounded-xl shadow-xl border border-gray-100",
        displayMode === "modal"
          ? "w-96 max-w-[90vw] max-h-[80vh]"
          : displayMode === "dropdown"
          ? "w-[90vw] sm:w-80 max-h-[400px]"
          : ""
      )}
    >
      {/* Header */}
      {showHeader && (
        <div className="bg-[#3A76F0] px-6 py-4 flex justify-between items-center shrink-0">
          <h3 className="text-white font-semibold text-lg">Notifications</h3>
          {(displayMode === "modal" ||
            displayMode === "dropdown" ||
            onClose) && (
            <button
              onClick={handleClose}
              className="bg-white/20 hover:bg-white/30 text-white rounded-lg p-1.5 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div className="overflow-y-auto flex-1 relative min-h-[220px]">
        <AnimatePresence initial={false}>
          {unreadNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 1, x: 0, height: "auto" }}
              exit={{
                opacity: 0,
                x: -100,
                height: 0,
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: 0,
                marginBottom: 0,
                overflow: "hidden",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30, duration: 0.3 }}
              className="p-4 hover:bg-gray-50 border-b border-gray-50 transition-colors flex gap-3 cursor-pointer bg-blue-50/30"
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="mt-1 flex-shrink-0">
                <Avatar
                  name="System"
                  size="sm"
                  className={
                    notification.type === "success"
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600"
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 leading-snug">
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {notification.createdAt?.seconds
                    ? new Date(
                        notification.createdAt.seconds * 1000
                      ).toLocaleDateString()
                    : "Just now"}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {unreadNotifications.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center py-12 px-6 text-center absolute inset-0"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
              <FaBell className="w-6 h-6 text-blue-300" />
            </div>
            <p className="text-gray-900 font-medium mb-1">
              No notifications yet
            </p>
            <p className="text-gray-500 text-xs max-w-[200px]">
              We'll let you know when something important happens
            </p>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      {shouldShowFooter && (
        <div className="bg-gray-55/90 p-3 flex justify-between items-center px-4 border-t border-gray-100 shrink-0">
          <Link
            href="/notifications"
            className="text-xs text-[#1449b2] font-semibold hover:underline"
            onClick={handleClose}
          >
            View All
          </Link>
          <button
            className="text-xs text-gray-500 font-medium hover:underline"
            onClick={handleClose}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );

  if (displayMode === "inline") {
    return renderContent();
  }

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {customTrigger ? (
          customTrigger(toggleOpen, unreadCount)
        ) : (
          <div
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors relative"
            onClick={toggleOpen}
          >
            <FiBell className="w-5 h-5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-b from-[#3A76F0] to-[#012A7D] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        )}

        {/* Dropdown Mode using absolute positioning */}
        {isOpen && displayMode === "dropdown" && (
          <div className={cn(
            "absolute z-50 animate-in fade-in zoom-in-95 duration-200",
            position === "right"
              ? "right-0 top-full mt-3 origin-top-right shadow-xl"
              : "left-full bottom-0 mb-0 ml-4 origin-bottom-left"
          )}>
            {position === "right" ? (
              renderContent()
            ) : (
              <div className="absolute bottom-full left-0 mb-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-left">
                {renderContent()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Mode using fixed positioning */}
      {isOpen && displayMode === "modal" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative animate-in zoom-in-95 duration-200">
            {renderContent()}
          </div>
          <div className="absolute inset-0 -z-10" onClick={handleClose}></div>
        </div>
      )}
    </>
  );
};

export default NotificationDropdown;
