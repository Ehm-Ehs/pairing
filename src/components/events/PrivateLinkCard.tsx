"use client";

import { copyToClipboard } from "@/utils/clipboard";
import React, { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "pairform_private_link";

/** Remembers the participant's private link for the success screen (this browser tab only). */
export function rememberPrivateLink(url: string | undefined | null) {
  try {
    if (url) sessionStorage.setItem(STORAGE_KEY, url);
  } catch {
    // Storage unavailable; the link is still sent by email or WhatsApp.
  }
}

/**
 * Shown after joining. The private link is how a participant returns to see their own
 * assignment, so it is displayed once here and also sent to their email or WhatsApp.
 */
export const PrivateLinkCard: React.FC = () => {
  // Read after hydration so the server-rendered markup (no link) always matches.
  const link = useSyncExternalStore(
    () => () => {},
    () => {
      try {
        return sessionStorage.getItem(STORAGE_KEY) || "";
      } catch {
        return "";
      }
    },
    () => ""
  );
  const [copied, setCopied] = useState(false);

  if (!link) return null;

  const copy = async () => {
    if (await copyToClipboard(link)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="w-full bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 text-left">
      <p className="text-sm font-bold text-gray-900 mb-1">Your private link</p>
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
        Use this link to see your assignment. It is only for you, so please do not share it. We also sent it to
        the contact details you registered with.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.target.select()}
          aria-label="Your private link"
          className="flex-1 min-w-0 px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl text-gray-700 font-mono"
        />
        <button
          type="button"
          onClick={copy}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
};
