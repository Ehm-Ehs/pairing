import { Link } from "react-router-dom";
import Logo from "../../assets/logo";
import { ReactNode } from "react";

interface HeaderProps {
  children?: ReactNode;
  user?: any; // You can type `user` based on your user data structure
}

function Header({ children, user }: HeaderProps) {
  return (
    <div>
      <div className="flex items-center justify-between px-10 text-[#5324FB]">
        <Link to="/home">
          {" "}
          <div className="flex items-center gap-2 py-5">
            <div className="w-10 h-10">
              <Logo />
            </div>
            <p className="pt-3 font-semibold text-black">Pairing</p>
          </div>
        </Link>

        {user ? (
          <>
            <Link to="/your-pairing">Your Pairings</Link>
            <div className="flex gap-3">
              <div className="focus:outline-none">Notifications</div>
              <div className="focus:outline-none">Profile</div>
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
