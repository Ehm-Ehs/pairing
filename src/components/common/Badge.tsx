import React from "react";

export const Badge = ({
  children,
  variant,
  className,
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary";
  className?: string;
}) => (
  <span
    className={`px-2 py-1 rounded-full text-xs font-medium ${
      variant === "secondary"
        ? "bg-gray-100 text-gray-800"
        : "bg-blue-100 text-blue-800"
    } ${className}`}
  >
    {children}
  </span>
);
