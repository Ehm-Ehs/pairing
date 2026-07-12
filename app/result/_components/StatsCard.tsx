import React from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  titleColor?: string;
  descColor?: string;
  variant?: "blue" | "indigo" | "pink" | "yellow";
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  description,
  bgColor,
  textColor,
  borderColor,
  titleColor,
  descColor,
  variant,
  className = "",
}) => {
  // Determine colors based on variant or custom colors
  let bg = bgColor || "";
  let text = textColor || "";
  let border = borderColor || "";
  let tColor = titleColor || "";
  let dColor = descColor || "";

  if (variant === "blue") {
    bg = "bg-[#E0F2FE]";
    text = "text-[#0369A1]";
    border = "border-[#BAE6FD]";
    tColor = "text-[#0284C7]/80";
    dColor = "text-[#0284C7]/70";
  } else if (variant === "indigo") {
    bg = "bg-[#E0E7FF]";
    text = "text-[#3730A3]";
    border = "border-[#C7D2FE]";
    tColor = "text-[#4F46E5]/80";
    dColor = "text-[#4F46E5]/70";
  } else if (variant === "pink") {
    bg = "bg-[#FCE7F3]";
    text = "text-[#BE185D]";
    border = "border-[#FBCFE8]";
    tColor = "text-[#DB2777]/80";
    dColor = "text-[#DB2777]/70";
  } else if (variant === "yellow") {
    bg = "bg-[#FEF3C7]";
    text = "text-[#B45309]";
    border = "border-[#FDE68A]";
    tColor = "text-[#D97706]/80";
    dColor = "text-[#D97706]/70";
  }

  return (
    <div
      className={`rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-sm border ${bg} ${text} ${border} ${className}`}
    >
      <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${tColor}`}>
        {title}
      </span>
      <span className="text-3xl font-extrabold font-heading">
        {value}
      </span>
      <span className={`text-[10px] font-semibold mt-0.5 ${dColor}`}>
        {description}
      </span>
    </div>
  );
};

export default StatsCard;
