"use client";

import React, { useState, useEffect } from "react";
import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import { TOKEN_PACKS, TokenPack } from "../../src/types/tokenTypes";
import { TokenBadge } from "../../src/components/tokens/TokenBadge";
import { LuCheck, LuCoins, LuLock, LuSparkles, LuZap } from "react-icons/lu";
import { toast } from "react-toastify";
import { useSearchParams } from "next/navigation";

export default function PricingPage() {
  return (
    <NextProtectedRoute>
      {(user) => <PricingContent user={user} />}
    </NextProtectedRoute>
  );
}

function PricingContent({ user }: { user: any }) {
  const searchParams = useSearchParams();
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    const isSuccess = searchParams.get("payment") === "success";
    const ref = searchParams.get("reference") || searchParams.get("trxref");
    if (isSuccess || ref) {
      if (ref && user?.userId) {
        fetch(`/api/payments/paystack/verify?reference=${encodeURIComponent(ref)}&accountId=${encodeURIComponent(user.userId)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              toast.success("Payment verified! Tokens credited to your account.", {
                position: "top-center",
                autoClose: 5000,
              });
            }
          })
          .catch((err) => console.error("Payment verification error:", err));
      } else {
        toast.success("Payment successful! Tokens credited to your account.", {
          position: "top-center",
          autoClose: 5000,
        });
      }
    }
  }, [searchParams, user?.userId]);

  const handleBuyPack = async (pack: TokenPack) => {
    if (!user?.email || !user?.userId || user?.isAnonymous) {
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
          email: user.email,
          accountId: user.userId,
          accountType: "user",
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

  const currentBalance = typeof user?.tokenBalance === "number" ? user.tokenBalance : 50;
  const currentTier = user?.tier || "free";
  const hasEverPaid = user?.hasEverPaid === true;

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
            Top up your account with lifetime participant tokens. Purchasing any pack automatically upgrades your account from Free to Paid.
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
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-extrabold uppercase px-4 py-1.5 rounded-full shadow-md tracking-wider flex items-center gap-1.5">
                  Most Popular
                </span>
              )}

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{pack.name}</h3>
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ₦{pack.priceNGN.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">
                    (₦{pack.ratePerToken}/token)
                  </span>
                </div>

                <ul className="space-y-3 text-xs font-medium text-gray-600 my-6">
                  <li className="flex items-center gap-2.5">
                    <LuCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 font-bold" />
                    <span><strong>{pack.tokens}</strong> Participant Tokens</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <LuCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 font-bold" />
                    <span>No Expiry (Infinite Rollover)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <LuCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 font-bold" />
                    <span>Converts Free Account → Paid Pro</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <LuCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 font-bold" />
                    <span>Enables -20 Overdraft Buffer</span>
                  </li>
                </ul>
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
            <h4 className="font-bold text-gray-900 text-sm">Paid Overdraft Buffer (-20)</h4>
            <p>
              Paid accounts are allowed to go down to <strong>-20 tokens</strong> so live joins are never blocked mid-event. Creation of new events is blocked beyond -20 until topped up.
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

      {/* Interactive Login Prompt Overlay */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 max-w-md w-full shadow-2xl relative flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowLoginPrompt(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 bg-gray-100 p-2 rounded-full transition-colors"
            >
              <LuLock className="w-4 h-4 hidden" />
              ×
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
}
