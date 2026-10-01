"use client";

import React from "react";
import Link from "next/link";
import { LuCheck, LuCoins, LuSparkles, LuZap } from "react-icons/lu";
import { TOKEN_PACKS } from "../../types/tokenTypes";

interface PricingSectionProps {
  onGetStarted?: () => void;
}

export default function PricingSection({ onGetStarted }: PricingSectionProps) {
  return (
    <section id="pricing" className="py-20 bg-white relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">

          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Pay As You Scale
          </h2>
          <p className="text-gray-500 text-sm md:text-base font-medium">
            1 token = 1 participant onboarded into an event. Tokens <strong className="text-gray-900">never expire</strong> and roll forward indefinitely.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Free Tier Card */}
          <div className="rounded-[2.5rem] p-8 border border-gray-200/90 bg-white shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold uppercase tracking-wider mb-4">
                Free Starter
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Free Grant</h3>
              <p className="text-xs text-gray-500 font-medium mb-4">One-time grant at signup</p>
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-4xl font-extrabold text-gray-900">₦0</span>
                <span className="text-xs text-gray-400 font-semibold">/forever</span>
              </div>

              <ul className="space-y-3 text-xs text-gray-600 font-medium my-6 border-t border-gray-100 pt-6">
                <li className="flex items-center gap-2.5">
                  <LuCheck className="w-4 h-4 text-emerald-500 font-bold flex-shrink-0" />
                  <span><strong>50 Tokens</strong> (Personal Account)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <LuCheck className="w-4 h-4 text-emerald-500 font-bold flex-shrink-0" />
                  <span><strong>75 Tokens</strong> (Organization Account)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <LuCheck className="w-4 h-4 text-emerald-500 font-bold flex-shrink-0" />
                  <span>All Event Types & Pairing Algorithms</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <LuCheck className="w-4 h-4 text-emerald-500 font-bold flex-shrink-0" />
                  <span>Instant WhatsApp & Email Invites</span>
                </li>
              </ul>
            </div>

            <Link
              href="/create-event"
              onClick={onGetStarted}
              className="w-full py-3.5 px-6 rounded-full font-bold text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors mt-4 text-center block"
            >
              Get Started Free
            </Link>
          </div>

          {/* Dynamic Token Pack Cards */}
          {TOKEN_PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`relative rounded-[2.5rem] p-8 border transition-all duration-300 flex flex-col justify-between ${pack.popular
                ? "border-[#1D4ED8] bg-gradient-to-b from-blue-50/60 via-white to-white shadow-xl ring-2 ring-[#1D4ED8]/20 transform md:-translate-y-2"
                : "border-gray-200/90 bg-white hover:border-gray-300 shadow-xs hover:shadow-lg"
                }`}
            >
              {pack.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase px-4 py-1.5 rounded-full shadow-md tracking-wider flex items-center gap-1.5">
                  Most Popular
                </span>
              )}

              <div>
                <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-4">
                  {pack.tokens} Tokens
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">{pack.name}</h3>
                <p className="text-xs text-gray-500 font-medium mb-4">Standalone Pack</p>

                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ₦{pack.priceNGN.toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold">
                    (₦{pack.ratePerToken}/token)
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-gray-600 font-medium my-6 border-t border-gray-100 pt-6">
                  <li className="flex items-center gap-2.5">
                    <LuCheck className="w-4 h-4 text-emerald-500 font-bold flex-shrink-0" />
                    <span><strong>{pack.tokens}</strong> Participant Tokens</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <LuCheck className="w-4 h-4 text-emerald-500 font-bold flex-shrink-0" />
                    <span><strong>No Expiry</strong> (Infinite Rollover)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <LuCheck className="w-4 h-4 text-emerald-500 font-bold flex-shrink-0" />
                    <span>Converts Free Account → <strong>Paid Pro</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <LuCheck className="w-4 h-4 text-emerald-500 font-bold flex-shrink-0" />
                    <span>Unlocks <strong>-20 Overdraft Buffer</strong></span>
                  </li>
                </ul>
              </div>

              <Link
                href="/pricing"
                className={`w-full py-3.5 px-6 rounded-full font-bold text-xs text-center transition-all shadow-md mt-4 ${pack.popular
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25"
                  : "bg-gray-900 hover:bg-black text-white"
                  }`}
              >
                Buy {pack.name}
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom Callout banner */}
        <div className="mt-14 bg-gray-50 border border-gray-200/80 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-[#1D4ED8] flex items-center justify-center font-bold flex-shrink-0">
              <LuCoins className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Need 2,000+ Tokens or Custom Enterprise Setup?</h4>
              <p className="text-xs text-gray-500 font-medium">Get custom volume rates down to ₦32–35 per token with dedicated onboarding support.</p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="px-6 py-3 bg-white hover:bg-gray-100 border border-gray-200 text-gray-900 font-bold text-xs rounded-full transition-colors whitespace-nowrap shadow-2xs"
          >
            Explore All Pricing & Packs
          </Link>
        </div>
      </div>
    </section>
  );
}
