import Link from "next/link";
import Logo from "../../assets/logo";
import { ReactNode, useState, useRef, useEffect } from "react";
import Avatar from "../ui/avatar";
import NotificationDropdown from "../ui/NotificationDropdown";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { capitalizeWords } from "../../utils/stringUtils";

import { GroupingsPageProps } from "../../types";

interface HeaderProps {
  children?: ReactNode;
  user?: GroupingsPageProps | null;
}

function Header({ children, user }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = "/"; // Redirect to home/login after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 relative z-50">
      <div className="flex items-center justify-between px-5 sm:px-10 py-4 max-w-7xl mx-auto">
        <Link href="/home">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10">
              <Logo />
            </div>
            <p className="font-semibold text-black text-xl">Pair Form</p>
          </div>
        </Link>
        {user ? (
          <div className="flex items-center gap-6">
            <NotificationDropdown userId={user.userId || user.uid!} />

            <div className="relative" ref={dropdownRef}>
              <div
                className="cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <Avatar name={`${user.firstName} ${user.lastName}`} size="md" />
              </div>

              {isProfileOpen && (
                <div
                  className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bg-[#3A76F0] px-6 py-5 text-center">
                    <div className="flex justify-center mb-3">
                      <Avatar
                        name={`${user.firstName} ${user.lastName}`}
                        size="lg"
                        className="border-4 border-white/20 shadow-sm"
                      />
                    </div>
                    <p className="text-white font-semibold text-lg truncate">
                      {capitalizeWords(`${user.firstName} ${user.lastName}`)}
                    </p>
                  </div>

                  <div className="p-4">
                    <div
                      onClick={handleSignOut}
                      className="w-full text-center py-2.5 rounded-full bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      Logout
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <Link href="/login" className="text-blue-700 font-medium">
              Login
            </Link>
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default Header;
