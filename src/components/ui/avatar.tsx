import React from "react";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const pastelColors = [
  "bg-blue-200 text-blue-800",
  "bg-green-200 text-green-800",
  "bg-yellow-200 text-yellow-800",
  "bg-pink-200 text-pink-800",
  "bg-purple-200 text-purple-800",
  "bg-indigo-200 text-indigo-800",
  "bg-red-200 text-red-800",
  "bg-orange-200 text-orange-800",
  "bg-teal-200 text-teal-800",
  "bg-cyan-200 text-cyan-800",
];

const getInitials = (name: string) => {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].substring(0, 1).toUpperCase();
  }
  return (
    parts[0].substring(0, 1) + parts[parts.length - 1].substring(0, 1)
  ).toUpperCase();
};

const getColor = (name: string) => {
  if (!name) return pastelColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % pastelColors.length;
  return pastelColors[index];
};

const Avatar: React.FC<AvatarProps> = ({
  name,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${
        sizeClasses[size]
      } ${getColor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
