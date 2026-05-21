"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  FaHome,
  FaPlus,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaUsers,
  FaDice,
  FaBell,
} from "react-icons/fa";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Logo from "../../assets/logo";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { GroupingsPageProps } from "../../types";
import Avatar from "../ui/avatar";
import NotificationDropdown from "../ui/NotificationDropdown";

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  user: GroupingsPageProps;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({
  user,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const searchParams = useSearchParams();

  /* New state for inline notification view */
  const [showNotifications, setShowNotifications] = useState(false);

  // If sidebar collapses, we should probably exit notification view to avoid weird states,
  // OR we switch to the modal/popover behavior.
  // The user says "when sidebar is open... show in sidebar".
  // Let's reset it if collapsed.
  useEffect(() => {
    if (isCollapsed) setShowNotifications(false);
  }, [isCollapsed]);

  const navItems = [
    { name: "Group", href: "/home?filter=role-based", icon: FaUsers },
    { name: "Single", href: "/home?filter=secret-santa", icon: FaUser },
    { name: "Random", href: "/home?filter=random-positioning", icon: FaDice },
  ];

  const sidebarVariants = {
    expanded: { width: "240px" },
    collapsed: { width: "80px" },
  };

  return (
    <motion.div
      initial="expanded"
      animate={isCollapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      className={cn(
        "h-screen sticky top-0 bg-white border-r border-gray-100 shadow-sm z-40 hidden md:flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0"
      )}
    >
      {/* Header / Logo */}
      <div className="p-4 flex items-center justify-between shrink-0 relative">
        <Link href="/home" className="flex items-center gap-2 overflow-visible">
          <div className="min-w-[40px] h-10 w-10 flex-shrink-0">
            <Logo />
          </div>
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: isCollapsed ? 0 : 1 }}
            transition={{ duration: 0.2 }}
            className="font-bold text-xl text-gray-800 whitespace-nowrap ml-2"
          >
          </motion.span>
        </Link>

        {/* Absolute Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 bg-white border border-gray-200 p-1 rounded-full shadow-sm text-gray-500 hover:text-gray-900 transition-all z-50"
        >
          {isCollapsed ? (
            <FaChevronRight size={10} />
          ) : (
            <FaChevronLeft size={10} />
          )}
        </button>
      </div>

      {/* Content Area: Either Navigation OR Notification List */}
      {showNotifications && !isCollapsed ? (
        <div className="flex-1 overflow-hidden flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Header for Notifications (Bell Icon to Go Back) */}
          <div
            className="px-6 py-4 flex items-center gap-3 text-blue-600 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-100"
            onClick={() => setShowNotifications(false)}
          >
            <FaBell className="w-5 h-5" />
            <span className="font-semibold">Notifications</span>
          </div>

          {/* Notification List Inline */}
          <div className="flex-1 overflow-y-auto">
            <NotificationDropdown
              userId={user.userId || user.uid || ""}
              displayMode="inline"
              showHeader={false}
              onClose={() => setShowNotifications(false)}
            />
          </div>
        </div>
      ) : (
        /* Standard Navigation */
        <nav className="flex-1 px-3 py-6 space-y-4 overflow-y-auto">
          {/* Create Event Button Link... kept as is */}

          {navItems.map((item) => {
            const itemFilter = item.href.split("=")[1];
            const currentFilter = searchParams.get("filter");
            const isActive =
              pathname === "/home" && currentFilter === itemFilter;

            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    "relative flex items-center px-3 py-3 rounded-xl transition-all duration-200 group cursor-pointer",
                    isActive
                      ? "text-blue-600 font-medium bg-blue-50"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <div className="relative z-10 flex items-center gap-3">
                    <item.icon
                      size={20}
                      className={
                        isActive
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-600"
                      }
                    />
                    <motion.span
                      animate={{
                        opacity: isCollapsed ? 0 : 1,
                        width: isCollapsed ? 0 : "auto",
                      }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.name}
                    </motion.span>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      )}

      {/* User Footer */}
      <div className="p-3 border-t border-gray-100 flex flex-col gap-2 shrink-0">
        {/* Notification Trigger */}
        <div
          className={cn(
            "flex items-center transition-colors cursor-pointer",
            isCollapsed ? "justify-center" : "justify-end px-2"
          )}
        >
          {/* If Collapsed: Use Dropdown. If Expanded: Toggle Inline View */}
          {isCollapsed ? (
            <NotificationDropdown
              userId={user.userId || user.uid || ""}
              displayMode="dropdown" // Using dropdown for collapsed as per user ("what happens for notification on open... should happen on close" - wait, user said this earlier, but now differentiating. I will stick to dropdown for collapsed for now as it makes sense for space)
            />
          ) : (
            // Custom Trigger for Inline View
            <div
              className={cn(
                "p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600",
                showNotifications ? "bg-blue-50 text-blue-600" : ""
              )}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FaBell className="w-6 h-6" />
              {/* Badge logic would go here if we had access to notification count... 
                     We might need to hoist notification count or just hide it when viewing.
                     For now, simplified trigger.
                  */}
            </div>
          )}
        </div>

        <div
          className={cn(
            "flex items-center gap-3 p-2 rounded-xl bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer group",
            isCollapsed ? "justify-center" : ""
          )}
        >
          <div className="relative min-w-[40px]">
            <Avatar name={`${user?.firstName} ${user?.lastName}`} size="md" />
          </div>

          <motion.div
            animate={{
              opacity: isCollapsed ? 0 : 1,
              width: isCollapsed ? 0 : "auto",
            }}
            className="flex-1 overflow-hidden"
          >
            <p className="text-sm font-semibold text-gray-900 truncate capitalize">
              {user?.firstName} {user?.lastName}
            </p>
            {user?.email && (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            )}
          </motion.div>

          {!isCollapsed && (
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <FaSignOutAlt size={16} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
