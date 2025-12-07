import { Link } from "react-router-dom";
import Logo from "../../assets/logo";
import { ReactNode, useState, useRef, useEffect } from "react";
import { FaBell, FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { auth } from "../api/firebase";

interface HeaderProps {
  children?: ReactNode;
  user?: any; // You can type `user` based on your user data structure
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
    <div>
      <div className="flex items-center justify-between px-5 sm:px-10 text-[#5324FB]">
        <Link to="/home">
          <div className="flex items-center gap-2 py-5">
            <div className="w-10 h-10">
              <Logo />
            </div>
            <p className="pt-3 font-semibold text-black">Pair Form</p>
          </div>
        </Link>

        {user ? (
          <>
            <p className="text-sm font-semibold text-gray-900">Your Pairings</p>
            <div className="flex items-center gap-4">
              <div className="focus:outline-none text-gray-600 hover:text-gray-900 transition-colors">
                <FaBell className="w-5 h-5" />
              </div>

              <div className="relative" ref={dropdownRef}>
                <div
                  className="focus:outline-none text-gray-600 hover:text-gray-900 transition-colors flex items-center cursor-pointer"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <FaUserCircle className="w-6 h-6" />
                </div>

                {isProfileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-200"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <FaSignOutAlt className="w-3 h-3" />
                      Sign out
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex gap-3">
            <Link to="/login" className="text-blue-700">
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
