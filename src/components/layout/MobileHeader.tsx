"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FaUser, FaUsers, FaDice, FaSignOutAlt, FaBell } from "react-icons/fa";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Logo from "../../assets/logo";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { GroupingsPageProps } from "../../types";
import Avatar from "../ui/avatar";
import { useState, useRef, useEffect } from "react";
import NotificationDropdown from "../ui/NotificationDropdown";

// Utility for merging classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MobileHeaderProps {
  user: GroupingsPageProps;
}

export default function MobileHeader({ user }: MobileHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Refs for click outside detection
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Ref for inactivity timeout
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const INACTIVITY_LIMIT = 3 * 60 * 1000; // 3 minutes

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const closeAll = () => {
    setShowNotifications(false);
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
  };

  // Click Outside Logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        showNotifications
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node) &&
        isProfileOpen
      ) {
        setIsProfileOpen(false);
      }
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        isMenuOpen
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications, isProfileOpen, isMenuOpen]);

  // Inactivity Timer Logic
  const startInactivityTimer = () => {
    if (inactivityTimeoutRef.current)
      clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => {
      closeAll();
    }, INACTIVITY_LIMIT);
  };

  const clearInactivityTimer = () => {
    if (inactivityTimeoutRef.current)
      clearTimeout(inactivityTimeoutRef.current);
  };

  // Effect to start timer when any menu is open
  useEffect(() => {
    if (showNotifications || isMenuOpen || isProfileOpen) {
      startInactivityTimer();
    } else {
      clearInactivityTimer();
    }
    return () => clearInactivityTimer();
  }, [showNotifications, isMenuOpen, isProfileOpen]);

  const navItems = [
    { name: "Group", href: "/home?filter=role-based", icon: FaUsers },
    { name: "Single", href: "/home?filter=secret-santa", icon: FaUser },
    { name: "Random", href: "/home?filter=random-positioning", icon: FaDice },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link
          href="/home"
          className="flex items-center gap-2 overflow-visible z-50"
        >
          <div className="min-w-[40px] h-10 w-10 flex-shrink-0">
            <Logo />
          </div>

        </Link>

        <div className="flex items-center gap-3">
          {/* Notification Trigger */}
          <div
            className="relative"
            ref={notificationRef}
            onMouseEnter={clearInactivityTimer}
            onMouseLeave={startInactivityTimer}
          >
            <div
              onClick={() => {
                const newState = !showNotifications;
                if (newState) {
                  setIsMenuOpen(false);
                  setIsProfileOpen(false);
                }
                setShowNotifications(newState);
              }}
              className={cn(
                "p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer",
                showNotifications ? "bg-blue-50 text-blue-600" : ""
              )}
            >
              <FaBell size={20} />
            </div>
            {showNotifications && (
              <div className="fixed top-[65px] left-4 right-4 sm:left-auto sm:right-4 sm:w-80 max-h-[75vh] z-50 rounded-xl shadow-xl overflow-hidden border border-gray-100 bg-white flex flex-col">
                <NotificationDropdown
                  userId={user.userId || user.uid || ""}
                  displayMode="inline"
                  showFooter={true}
                  onClose={() => setShowNotifications(false)}
                />
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div
            className="relative"
            ref={profileRef}
            onMouseEnter={clearInactivityTimer}
            onMouseLeave={startInactivityTimer}
          >
            <div
              onClick={() => {
                const newState = !isProfileOpen;
                if (newState) {
                  setIsMenuOpen(false);
                  setShowNotifications(false);
                }
                setIsProfileOpen(newState);
              }}
              className="flex items-center focus:outline-none cursor-pointer"
            >
              <Avatar name={`${user?.firstName} ${user?.lastName}`} size="sm" />
            </div>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 border-b border-gray-50">
                  <p className="text-sm font-semibold text-gray-900 truncate capitalize">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <FaSignOutAlt size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Menu Button (Filters) */}
          <div
            className="relative"
            ref={menuRef}
            onMouseEnter={clearInactivityTimer}
            onMouseLeave={startInactivityTimer}
          >
            <button
              onClick={() => {
                const newState = !isMenuOpen;
                if (newState) {
                  setIsProfileOpen(false);
                  setShowNotifications(false);
                }
                setIsMenuOpen(newState);
              }}
              className={cn(
                "p-2 rounded-lg transition-colors border border-transparent",
                isMenuOpen
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Filter Events
                </div>
                {navItems.map((item) => {
                  const itemFilter = item.href.split("=")[1];
                  const currentFilter = searchParams.get("filter");
                  const isActive =
                    pathname === "/home" && currentFilter === itemFilter;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                        isActive
                          ? "text-blue-600 bg-blue-50/50"
                          : "text-gray-600"
                      )}
                    >
                      <item.icon
                        size={18}
                        className={isActive ? "text-blue-600" : "text-gray-400"}
                      />
                      <span className="font-medium text-sm">{item.name}</span>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
