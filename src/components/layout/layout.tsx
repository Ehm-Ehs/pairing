import { ReactNode, useState, useRef, useEffect } from "react";
import { GroupingsPageProps } from "../../types";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FaChevronDown, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import { FiBell } from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import Logo from "../../assets/logo";
import Avatar from "../ui/avatar";
import NotificationDropdown from "../ui/NotificationDropdown";
import { toast } from "react-toastify";

import {
  CalendarCustomIcon,
  CogSettingsCustomIcon,
  LinkedRingsIcon,
} from "../ui/icons";

interface LayoutProps {
  children: ReactNode;
  user?: GroupingsPageProps | null;
}

function Layout({ children, user }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f8f9fa] font-sora">
        {/* Floating Navbar */}
        <header className="w-full max-w-7xl mx-auto px-4 pt-4 shrink-0 relative z-50">
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-full px-4 md:px-6 py-2.5 flex items-center justify-between shadow-sm">
            {/* Left: Logo & Title */}
            <Link href="/home" className="flex items-center gap-2">
              <Logo iconOnly={true} className="w-9 h-9 text-[#3A76F0] flex-shrink-0" />
              <span className="font-extrabold text-xl text-[#0c3886] tracking-tight font-heading leading-none">
                Pair Form
              </span>
            </Link>

            {/* Center Tabs: Desktop Only */}
            <nav className="hidden md:flex bg-gray-100/80 p-1 rounded-full border border-gray-200/50">
              <Link
                href="/home"
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-1.5 ${pathname === "/home" || pathname === "/create-event" || pathname.startsWith("/your-pairing") || pathname.startsWith("/result")
                  ? "bg-white text-[#3A76F0] shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                <CalendarCustomIcon className="w-4 h-3.5" />
                My Events
              </Link>
              <Link
                href="/settings"
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 flex items-center gap-1.5 ${pathname === "/settings"
                  ? "bg-white text-[#3A76F0] shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
                  }`}
              >
                <CogSettingsCustomIcon className="w-3.5 h-3.5" />
                Settings
              </Link>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3  bg-gray-100/80 p-1 rounded-full border border-gray-200/50">
              {/* Create Event Button */}
              <button
                onClick={() => router.push("/create-event")}
                className="bg-gradient-to-b from-[#3A76F0] to-[#012A7D] hover:from-[#4280FF] hover:to-[#023194] text-white rounded-full px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              >
                <LinkedRingsIcon className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">Create Event</span>
              </button>

              {/* Notification Bell */}
              <NotificationDropdown
                userId={user.userId || user.uid || ""}
                displayMode="dropdown"
                position="right"
                customTrigger={(onClick, unreadCount) => (
                  <div
                    onClick={onClick}
                    className="w-10 h-10 hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors relative active:scale-95 focus:outline-none"
                    aria-label="Toggle notifications"
                  >
                    <svg width="17" height="24" viewBox="0 0 17 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.60928 1.16667C9.60928 0.522334 9.08695 0 8.44262 0C7.79828 0 7.27595 0.522334 7.27595 1.16667V2.91667C7.27595 2.94902 7.27727 2.98107 7.27985 3.01276C3.96726 3.56637 1.44261 6.44553 1.44261 9.91539V14.5833C1.44261 15.1669 0.964152 16.1789 0.440552 17.1116C-0.296225 18.4241 -0.16129 20.0065 1.24534 20.5421C2.66006 21.0807 4.92308 21.5833 8.44262 21.5833C11.9621 21.5833 14.2252 21.0807 15.6399 20.5421C17.0465 20.0065 17.1815 18.4241 16.4447 17.1116C15.9211 16.1789 15.4426 15.1669 15.4426 14.5833V9.91595C15.4426 6.44609 12.918 3.56647 9.60538 3.01278C9.60796 2.98108 9.60928 2.94903 9.60928 2.91667V1.16667Z" fill="#667185" />
                      <path d="M4.8494 22.5454C4.89295 22.5833 4.94554 22.6277 5.00679 22.6767C5.18213 22.817 5.43263 22.9988 5.74922 23.1797C6.37755 23.5387 7.30656 23.9167 8.44263 23.9167C9.57871 23.9167 10.5077 23.5387 11.136 23.1797C11.4526 22.9988 11.7031 22.817 11.8785 22.6767C11.9397 22.6277 11.9923 22.5833 12.0359 22.5454C11.0158 22.6724 9.82632 22.7501 8.44263 22.7501C7.05895 22.7501 5.86947 22.6724 4.8494 22.5454Z" fill="#667185" />
                    </svg>                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-b from-[#3A76F0] to-[#012A7D] text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                )}
              />

              {/* Profile Dropdown Menu */}
              <div className="relative" ref={profileMenuRef}>
                <div
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="border border-gray-200 rounded-full pl-1.5 pr-2.5 py-1 flex items-center gap-2 hover:bg-gray-50 cursor-pointer select-none transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#3A76F0] font-bold">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-gray-700 hidden md:inline truncate max-w-[100px]">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <FaChevronDown className="w-3 h-3 text-gray-400" />
                </div>

                {/* Dropdown popup */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-gray-50">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium mt-1"
                    >
                      <FaSignOutAlt className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Burger Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                {showMobileMenu ? <FaTimes className="w-5 h-5" /> : <FaBars className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {showMobileMenu && (
            <div className="md:hidden mt-2 bg-white border border-gray-100 rounded-3xl shadow-lg p-4 z-40 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200 mx-2">
              <Link
                href="/home"
                onClick={() => setShowMobileMenu(false)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2.5 ${pathname === "/home" || pathname === "/create-event" || pathname.startsWith("/your-pairing") || pathname.startsWith("/result")
                  ? "bg-[#3A76F0]/10 text-[#3A76F0]"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <CalendarCustomIcon className="w-4 h-4" />
                My Events
              </Link>
              <Link
                href="/settings"
                onClick={() => setShowMobileMenu(false)}
                className={`w-full text-left px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2.5 ${pathname === "/settings"
                  ? "bg-[#3A76F0]/10 text-[#3A76F0]"
                  : "text-gray-600 hover:bg-gray-50"
                  }`}
              >
                <CogSettingsCustomIcon className="w-4 h-4" />
                Settings
              </Link>
            </div>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-grow p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <div className="">
        <main>{children}</main>
      </div>
    </>
  );
}

export default Layout;
