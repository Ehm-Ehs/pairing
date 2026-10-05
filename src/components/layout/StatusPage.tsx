import React from "react";
import Link from "next/link";
import Logo from "@/assets/logo";

interface Props {
  icon: React.ReactNode;
  badge: string;
  title: string;
  message: string;
  /** Buttons or links shown under the message. */
  children: React.ReactNode;
}

export const STATUS_PRIMARY_ACTION =
  "w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-[#205BE2] via-[#1A4ED8] to-[#0A389D] rounded-full hover:from-[#1b4ec2] hover:to-[#082f85] transition-all shadow-md flex items-center justify-center gap-2 active:scale-98";
export const STATUS_SECONDARY_ACTION =
  "w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex items-center justify-center gap-2";

/** Full-page message used for the "not found" and "something went wrong" screens. */
export const StatusPage: React.FC<Props> = ({ icon, badge, title, message, children }) => (
  <div className="min-h-screen bg-gradient-to-b from-[#99bbff]/30 via-[#e6efff]/40 to-white text-slate-900 font-sans flex flex-col justify-between p-4 sm:p-8">
    <header className="max-w-7xl mx-auto w-full flex items-center py-4">
      <Link href="/" aria-label="PairForm Home">
        <Logo className="h-9 w-auto" />
      </Link>
    </header>

    <main className="max-w-xl mx-auto w-full my-auto py-8 text-center">
      <div className="bg-white border border-blue-100 rounded-[2.5rem] p-8 sm:p-12 shadow-xl relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1d4ed8] mb-6 shadow-xs">
            {icon}
          </div>
          <span className="px-3.5 py-1 rounded-full bg-blue-50 text-[#1d4ed8] text-[11px] font-bold uppercase tracking-wider mb-3">
            {badge}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">{title}</h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto mb-8 font-normal leading-relaxed">
            {message}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">{children}</div>
        </div>
      </div>
    </main>

    <footer className="max-w-7xl mx-auto w-full text-center py-4 text-xs text-slate-400">
      © {new Date().getFullYear()} PairForm. Smart automated team formation.
    </footer>
  </div>
);
