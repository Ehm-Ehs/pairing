"use client";

import { PackFeatures } from "@/components/tokens/TokenPackParts";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useTokenCheckout } from "@/hooks/useTokenCheckout";
import { LoginPromptModal } from "@/components/auth/LoginPromptModal";
import React from "react";
import { TOKEN_PACKS } from "../../types/tokenTypes";
import { LuCoins, LuLock, LuX } from "react-icons/lu";

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
  const { loadingPackId, buyPack: handleBuyPack, showLoginPrompt, closeLoginPrompt } = useTokenCheckout({
    canPurchase: !!accountId && !!userEmail,
    accountType,
    accountId,
  });
  // The login prompt handles Escape itself while it is open.
  useEscapeKey(isOpen && !showLoginPrompt, onClose);

  if (!isOpen) return null;


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

                <PackFeatures pack={pack} className="my-4" />
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

      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={closeLoginPrompt}
        title="Log in to buy tokens"
        message="You need an account to buy and keep token packs. Create one for free, or log in if you already have one."
        returnTo="/pricing"
      />
    </div>
  );
};
