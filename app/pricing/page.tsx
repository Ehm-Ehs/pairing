"use client";

import { PackFeatures, PackPrice, PopularBadge } from "@/components/tokens/TokenPackParts";
import type { GroupingsPageProps } from "@/types";
import { useTokenCheckout } from "@/hooks/useTokenCheckout";
import { LoginPromptModal } from "@/components/auth/LoginPromptModal";
import { logger } from "@/utils/logger";
import { apiFetch } from "@/services/api";
import { useTokenLedger } from "@/hooks/useTokenLedger";
import React, { useEffect } from "react";
import NextProtectedRoute from "@/components/routes/NextProtectedRoute";
import { TOKEN_PACKS } from "@/types/tokenTypes";
import { TokenBadge } from "@/components/tokens/TokenBadge";
import { LuCoins } from "react-icons/lu";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";

export default function PricingPage() {
  return (
    <NextProtectedRoute>
      {(user) => <PricingContent user={user} />}
    </NextProtectedRoute>
  );
}

function PricingContent({ user }: { user: GroupingsPageProps }) {
  const searchParams = useSearchParams();
  const tokens = useTokenLedger(user);
  const { loadingPackId, buyPack: handleBuyPack, showLoginPrompt, closeLoginPrompt } = useTokenCheckout({
    canPurchase: !!user?.email && !!user?.userId && !user?.isAnonymous,
    accountType: tokens.ownerType === "org" ? "org" : "user",
    accountId: tokens.ownerId,
  });

  useEffect(() => {
    const isSuccess = searchParams.get("payment") === "success";
    const ref = searchParams.get("reference") || searchParams.get("trxref");
    if (isSuccess || ref) {
      if (ref && user?.userId) {
        apiFetch<{ success: boolean; tokens?: number }>(
          `/api/payments/paystack/verify?reference=${encodeURIComponent(ref)}`,
          { auth: "required" }
        )
          .then((data) => {
            if (data.success) {
              toast.success(`Payment verified! ${data.tokens ?? ""} tokens credited.`.replace("  ", " "), {
                position: "top-center",
                autoClose: 5000,
              });
            }
          })
          .catch((err) => {
            logger.error("Payment verification error:", err);
            toast.error(err.message || "We could not verify your payment. If you were charged, your tokens will appear shortly.", {
              position: "top-center",
            });
          });
      }
    }
  }, [searchParams, user?.userId]);


  const currentBalance = tokens.balance;
  const currentTier = tokens.tier;
  const hasEverPaid = tokens.hasEverPaid;

  return (
    <div className="py-10 px-4 max-w-6xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-[2.5rem] p-8 md:p-12 mb-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-xs font-semibold mb-4">
              PairForm Token Pricing Architecture
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              Pay As You Scale
            </h1>
            <p className="text-blue-200 text-sm md:text-base mt-2 max-w-xl font-medium">
              1 token = 1 participant onboarded into an event. Tokens never expire and roll forward indefinitely.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 flex flex-col items-center justify-center min-w-[220px]">
            <span className="text-xs font-semibold uppercase text-blue-200 tracking-wider mb-2">
              Your Current Balance
            </span>
            <TokenBadge
              balance={currentBalance}
              tier={currentTier}
              hasEverPaid={hasEverPaid}
            />
          </div>
        </div>
      </div>

      {/* Standalone Token Packs */}
      <div className="mb-14">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
            Standalone Token Packs
          </h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">
            Top up your account with lifetime participant tokens.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TOKEN_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-[2rem] p-8 border transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl ${pack.popular
                  ? "border-indigo-600 bg-gradient-to-b from-indigo-50/50 to-white ring-2 ring-indigo-600/30 transform md:-translate-y-2"
                  : "border-gray-200 bg-white hover:border-gray-300"
                }`}
            >
              {pack.popular && (
                <PopularBadge />
              )}

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{pack.name}</h3>
                <PackPrice pack={pack} />

                <PackFeatures pack={pack} className="my-6" />
              </div>

              <button
                onClick={() => handleBuyPack(pack)}
                disabled={loadingPackId === pack.id}
                className={`w-full py-4 px-6 rounded-full font-bold text-sm transition-all shadow-lg cursor-pointer ${pack.popular
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-indigo-500/25"
                    : "bg-gray-900 hover:bg-black text-white"
                  }`}
              >
                {loadingPackId === pack.id ? "Launching Paystack..." : `Get ${pack.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rules & FAQ Card */}
      <div className="bg-white border border-gray-200/90 rounded-[2.5rem] p-8 md:p-12 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <LuCoins className="w-5 h-5 text-indigo-600" />
          Token & Balance Rules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed text-gray-600 font-medium">
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-2">
            <h4 className="font-bold text-gray-900 text-sm">Deduction Rule</h4>
            <p>
              1 token is deducted when a participant actually joins an event. Creating an event or sending invitations does not deduct tokens.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-2">
            <h4 className="font-bold text-gray-900 text-sm">One-Time Free Grant</h4>
            <p>
              Personal accounts receive <strong>50 free tokens</strong> at signup. Organizations receive <strong>75 free tokens</strong> at creation. Free grants never expire or reset.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-2">
            <h4 className="font-bold text-gray-900 text-sm">Secure Paystack & OPay Checkout</h4>
            <p>
              Transactions are processed securely via Paystack. You can pay using Cards, Bank Transfer, USSD, or your OPay Wallet.
            </p>
          </div>
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
}
