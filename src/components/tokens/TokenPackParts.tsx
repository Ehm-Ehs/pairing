import React from "react";
import { LuCheck } from "react-icons/lu";
import { TokenPack } from "@/types/tokenTypes";

/** "Most Popular" ribbon shown on the highlighted pack. */
export const PopularBadge: React.FC = () => (
  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold uppercase px-4 py-1.5 rounded-full shadow-md tracking-wider flex items-center gap-1.5">
    Most Popular
  </span>
);

/** Price of a pack with its per-token rate. */
export const PackPrice: React.FC<{ pack: TokenPack }> = ({ pack }) => (
  <div className="flex items-baseline gap-1 my-4">
    <span className="text-4xl font-extrabold text-gray-900">₦{pack.priceNGN.toLocaleString()}</span>
    <span className="text-xs text-gray-400 font-semibold">(₦{pack.ratePerToken}/token)</span>
  </div>
);

/** What every token pack includes. The one list shown wherever packs are sold. */
export const PackFeatures: React.FC<{ pack: TokenPack; className?: string }> = ({ pack, className = "" }) => (
  <ul className={`space-y-3 text-xs font-medium text-gray-600 ${className}`}>
    <li className="flex items-center gap-2.5">
      <LuCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      <span>
        <strong>{pack.tokens}</strong> Participant Tokens
      </span>
    </li>
    <li className="flex items-center gap-2.5">
      <LuCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      <span>
        <strong>No Expiry</strong> (Infinite Rollover)
      </span>
    </li>
  </ul>
);
