"use client";

import React from "react";
import Link from "next/link";
import { LuCoins, LuSparkles } from "react-icons/lu";

interface TokenBadgeProps {
  balance?: number;
  tier?: string;
  hasEverPaid?: boolean;
}

export const TokenBadge: React.FC<TokenBadgeProps> = ({
  balance = 50,
  tier = "free",
  hasEverPaid = false,
}) => {
  const isSuperAdmin = tier === "super_admin" || balance === Infinity;
  const isNegative = !isSuperAdmin && balance < 0;
  const isDepleted = !isSuperAdmin && balance <= 0;

  const displayBalance = isSuperAdmin
    ? "∞ Unlimited"
    : `${balance} ${balance === 1 ? "Token" : "Tokens"}`;

  return (
    <Link
      href="/pricing"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 hover:scale-105 shadow-2xs ${
        isSuperAdmin
          ? "bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100"
          : isNegative
          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
          : isDepleted
          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
          : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
      }`}
      title="Manage Participant Tokens & Pricing Plan"
    >
      <div className="flex items-center gap-1.5">
        <LuCoins
          className={`w-4 h-4 font-bold ${
            isSuperAdmin ? "text-purple-600" : "text-emerald-600"
          }`}
        />
        <span className="font-mono font-bold tracking-tight">
          {displayBalance}
        </span>
      </div>

      <span
        className={`px-1.5 py-0.2 rounded-md text-[10px] uppercase font-bold tracking-wider ${
          isSuperAdmin
            ? "bg-purple-600 text-white"
            : hasEverPaid
            ? "bg-indigo-600 text-white"
            : "bg-gray-200 text-gray-700"
        }`}
      >
        {isSuperAdmin ? "SUPER ADMIN" : tier}
      </span>
    </Link>
  );
};
