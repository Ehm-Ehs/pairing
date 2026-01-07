import React, { useEffect, useState, useRef } from "react";
import {
  FaBell,
  FaCheckCircle,
  FaInfoCircle,
  FaExclamationCircle,
} from "react-icons/fa";
import {
  subscribeToNotifications,
  markNotificationAsRead,
  Notification,
} from "../../services/notifications";
import Avatar from "./avatar";

interface NotificationDropdownProps {
  userId: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  userId,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(userId, (data) => {
      setNotifications(data);
    });

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-green-500 w-5 h-5" />;
      case "warning":
        return <FaExclamationCircle className="text-yellow-500 w-5 h-5" />;
      case "error":
        return <FaExclamationCircle className="text-red-500 w-5 h-5" />;
      default:
        return <FaInfoCircle className="text-blue-500 w-5 h-5" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="bg-[#3A76F0] px-6 py-4">
            <h3 className="text-white font-semibold text-lg">Notifications</h3>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 cursor-pointer ${
                      !notification.read ? "bg-blue-50/30" : ""
                    }`}
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-2 text-center border-t border-gray-100">
            <button
              className="text-xs text-[#8B5CF6] font-medium hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
