import { FaSpinner } from "react-icons/fa";
import { cn } from "./utils";
import { TypeAnimation } from "react-type-animation";
import { ReactNode } from "react";

interface LoadingProps {
  className?: string;
  message?: string;
  icon?: ReactNode;
}

export const Loading = ({
  className,
  message = "Loading...",
  icon,
}: LoadingProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-screen bg-gray-50",
        className
      )}
    >
      <div className="mb-6 text-blue-600">
        {icon || <FaSpinner className="w-12 h-12 animate-spin" />}
      </div>
      <div className="text-gray-500 font-medium text-lg h-8">
        <TypeAnimation
          sequence={[message, 2000]}
          wrapper="span"
          speed={50}
          repeat={Infinity}
          cursor={true}
        />
      </div>
    </div>
  );
};
