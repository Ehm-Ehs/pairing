import React from "react";
import Logo from "@/assets/logo";

/** Colour themes for the participant-facing cards. Full class names so Tailwind can see them. */
export const JOIN_THEMES = {
  emerald: {
    border: "border-t-[#10B981]",
    icon: "bg-[#10B981] text-white",
    badge: "bg-[#D1FAE5] text-[#065F46]",
    ring: "focus:ring-emerald-500",
    button: "from-[#10B981] to-[#059669]",
  },
  purple: {
    border: "border-t-[#8338EC]",
    icon: "bg-[#8338EC] text-white",
    badge: "bg-[#F3E8FF] text-[#6B21A8]",
    ring: "focus:ring-purple-500",
    button: "from-[#8338EC] to-[#6f2ec9]",
  },
  blue: {
    border: "border-t-[#012A7D]",
    icon: "bg-[#2563EB] text-white",
    badge: "bg-[#E0EBFF] text-[#012A7D]",
    ring: "focus:ring-blue-500",
    button: "from-[#2563EB] to-[#012A7D]",
  },
  red: {
    border: "border-t-red-500",
    icon: "bg-red-100 text-red-600",
    badge: "bg-red-50 text-red-700",
    ring: "focus:ring-red-500",
    button: "from-red-500 to-red-700",
  },
  amber: {
    border: "border-t-amber-500",
    icon: "bg-amber-100 text-amber-600",
    badge: "bg-amber-50 text-amber-700",
    ring: "focus:ring-amber-500",
    button: "from-amber-500 to-amber-700",
  },
} as const;

export type JoinAccent = keyof typeof JOIN_THEMES;

export const NEUTRAL_BUTTON =
  "bg-[#e5e7eb] hover:bg-gray-300 text-gray-700 font-bold px-8 py-3.5 rounded-full text-xs transition-all cursor-pointer w-full h-auto text-center";

interface JoinCardProps {
  accent: JoinAccent;
  icon: React.ReactNode;
  title: string;
  badge: string;
  /** Extra chips shown next to the badge, e.g. a deadline. */
  badgeExtra?: React.ReactNode;
  /** Extra content under the badge, e.g. the event description. */
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}

/** The page frame and titled card shared by every participant-facing screen. */
export const JoinCard: React.FC<JoinCardProps> = ({ accent, icon, title, badge, badgeExtra, headerExtra, children }) => {
  const theme = JOIN_THEMES[accent];
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-start items-center px-4 py-12 text-left">
      <Logo className="h-9 w-auto mb-10" />
      <div
        className={`bg-white rounded-[2rem] border-t-4 ${theme.border} border-x border-b border-gray-200/60 shadow-sm w-full max-w-xl flex flex-col overflow-hidden`}
      >
        <div className="bg-[#F5F6F8] p-6 md:p-8 flex flex-col items-center border-b border-gray-200/60 w-full relative">
          <div
            className={`w-12 h-12 ${theme.icon} rounded-xl flex items-center justify-center shadow-md mb-4 flex-shrink-0`}
          >
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight text-center capitalize">
            {title}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
            <span className={`${theme.badge} text-xs font-semibold px-4 py-1.5 rounded-full`}>{badge}</span>
            {badgeExtra}
          </div>
          {headerExtra}
        </div>
        {children}
      </div>
    </div>
  );
};

/** Shown when a share link does not lead to an event. */
export const EventNotFound: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <div className="text-center max-w-sm">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">Event Not Found</h1>
      <p className="text-sm text-gray-500">The link may be invalid or the event has been deleted.</p>
    </div>
  </div>
);
