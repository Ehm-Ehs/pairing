"use client";

import React, { useState } from "react";
import { TOKEN_PACKS, TokenPack } from "../../types/tokenTypes";
import { LuCheck, LuCoins, LuLock, LuSparkles, LuX } from "react-icons/lu";
import { toast } from "react-toastify";

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  accountId?: string;
  accountType?: "user" | "org";
}

export const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen,
  onClose,
  userEmail,
  accountId,
  accountType = "user",
}) => {
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        if (showLoginPrompt) {
          setShowLoginPrompt(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, showLoginPrompt]);

  if (!isOpen) return null;

  const handleBuyPack = async (pack: TokenPack) => {
    if (!accountId || !userEmail) {
      setShowLoginPrompt(true);
      return;
    }

    setLoadingPackId(pack.id);
    try {
      const res = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.id,
          email: userEmail,
          accountId,
          accountType,
          redirectUrl: `${window.location.origin}/pricing?payment=success`,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Failed to initialize checkout session");
      }

      // Redirect to Paystack Checkout URL
      window.location.href = data.authorizationUrl;
    } catch (error: any) {
      console.error("Paystack Checkout Error:", error);
      toast.error(error.message || "Could not launch checkout");
    } finally {
      setLoadingPackId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-[2.5rem] max-w-3xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto p-6 md:p-10 shadow-2xl relative border border-gray-100 my-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
        >
          <LuX className="w-5 h-5" />
        </button>

        <div className="text-center max-w-lg mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-3">
            <LuCoins className="w-4 h-4 text-indigo-600" />
            Top-Up Participant Tokens
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Purchase Token Packs
          </h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">
            1 token = 1 participant onboarded into an event. Purchased tokens <span className="text-indigo-600 font-bold">never expire</span> and roll forward indefinitely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {TOKEN_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between ${pack.popular
                ? "border-indigo-600 shadow-xl bg-gradient-to-b from-indigo-50/40 to-white ring-2 ring-indigo-600/20"
                : "border-gray-200 bg-white hover:border-gray-300 shadow-xs"
                }`}
            >
              {pack.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[8px] font-extrabold uppercase px-3 py-1 rounded-full shadow-sm tracking-wider flex items-center gap-1">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{pack.name}</h3>
                <div className=" space-y-1 my-3">
                  <p className="text-3xl font-extrabold text-gray-900">
                    ₦{pack.priceNGN.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400 font-medium">
                    (₦{pack.ratePerToken}/token)
                  </p>
                </div>

                <ul className="space-y-2 text-xs text-gray-600 my-4">
                  <li className="flex items-center gap-2">
                    <LuCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{pack.tokens} Participant Tokens</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <LuCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Never expires (Infinite rollover)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <LuCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>Converts Free Account → Paid Pro</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleBuyPack(pack)}
                disabled={loadingPackId === pack.id}
                className={`w-full py-3 px-4 rounded-full font-bold text-xs transition-all shadow-md mt-4 ${pack.popular
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20"
                  : "bg-gray-900 hover:bg-black text-white"
                  }`}
              >
                {loadingPackId === pack.id ? "Launching Checkout..." : `Buy ${pack.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 gap-3">
          <div className="flex items-center gap-2">
            <LuLock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span>Secured via Paystack (Cards, Bank Transfer, USSD, OPay)</span>
          </div>
          <span className="font-semibold text-gray-700">Need 2,000+ tokens? Contact support for custom quotes.</span>
        </div>
      </div>

      {/* Interactive Login Prompt Overlay */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 max-w-md w-full shadow-2xl relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition-colors"
            >
              <LuX className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <LuLock className="w-6 h-6" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2 font-heading tracking-tight">
              Log In to Buy Tokens
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
              You need a registered user account to purchase and store token packs. Would you like to log in or create an account now?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-full text-xs font-bold transition-all flex-1 cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/login?redirect=${encodeURIComponent("/pricing")}`;
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow-md flex-1 cursor-pointer whitespace-nowrap"
              >
                Log In / Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
