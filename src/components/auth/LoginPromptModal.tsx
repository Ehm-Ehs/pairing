"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LuLock, LuX } from "react-icons/lu";
import { useEscapeKey } from "@/hooks/useEscapeKey";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  /** Where to return to after signing in, e.g. "/pricing". */
  returnTo: string;
}

/** Asks a signed-out visitor to log in or create an account before continuing. */
export const LoginPromptModal: React.FC<Props> = ({ isOpen, onClose, title, message, returnTo }) => {
  const router = useRouter();
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;

  const redirect = `redirect=${encodeURIComponent(returnTo)}`;
  const button = "px-6 py-3 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-prompt-title"
        className="bg-white rounded-[2.5rem] p-8 border border-gray-100 max-w-md w-full shadow-2xl relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition-colors"
        >
          <LuX className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <LuLock className="w-6 h-6" />
        </div>

        <h3 id="login-prompt-title" className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight">
          {title}
        </h3>
        <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">{message}</p>

        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            onClick={() => router.push(`/sign-up?${redirect}`)}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white shadow-md ${button}`}
          >
            Create free account
          </button>
          <button
            type="button"
            onClick={() => router.push(`/login?${redirect}`)}
            className={`bg-gray-100 hover:bg-gray-200 text-gray-800 ${button}`}
          >
            I already have an account
          </button>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-gray-500 hover:text-gray-700 py-1">
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};
