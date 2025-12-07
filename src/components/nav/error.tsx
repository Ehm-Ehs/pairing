import { Link } from "react-router-dom";
import { FaGhost, FaExclamationTriangle } from "react-icons/fa";
import { Button } from "../common/button";
import { ReactNode } from "react";

interface ErrorProps {
  code?: string | number;
  title?: string;
  message?: string;
  icon?: ReactNode;
  showHomeButton?: boolean;
}

function Error({
  code = "404",
  title = "Page Not Found",
  message = "Whoops! It looks like you've stumbled into a spooky empty void. The page you're looking for has vanished.",
  icon,
  showHomeButton = true,
}: ErrorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
          {icon ||
            (code === "404" ? (
              <FaGhost className="w-12 h-12 text-blue-600" />
            ) : (
              <FaExclamationTriangle className="w-12 h-12 text-red-600" />
            ))}
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-2">{code}</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        {showHomeButton && (
          <Link to="/">
            <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
              Take Me Home
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Error;
