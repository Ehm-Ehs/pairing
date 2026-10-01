"use client";

import React, { useState, useEffect } from "react";
import NextProtectedRoute from "../../src/components/routes/NextProtectedRoute";
import Avatar from "../../src/components/ui/avatar";
import { TokenBadge } from "../../src/components/tokens/TokenBadge";
import { TokenPurchaseModal } from "../../src/components/tokens/TokenPurchaseModal";
import { useWorkspace } from "../../src/context/WorkspaceContext";
import { capitalizeWords } from "../../src/utils/stringUtils";
import { db } from "../../src/services/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { TokenLedgerEntry } from "../../src/types/tokenTypes";
import Link from "next/link";
import {
  LuCoins,
  LuSparkles,
  LuUser,
  LuMail,
  LuBuilding,
  LuShieldCheck,
  LuHistory,
  LuArrowUpRight,
  LuCog,
  LuPlus,
} from "react-icons/lu";

import { fetchTokenLedger, fetchLedgerEntries } from "../../src/services/tokenLedgerService";
import { TokenLedger } from "../../src/types/tokenTypes";

export default function ProfilePage() {
  return (
    <NextProtectedRoute>
      {(user) => <ProfileContent user={user} />}
    </NextProtectedRoute>
  );
}

function ProfileContent({ user }: { user: any }) {
  const { activeWorkspace } = useWorkspace();
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [activeLedger, setActiveLedger] = useState<TokenLedger | null>(null);
  const [ledgerEntries, setLedgerEntries] = useState<TokenLedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(true);

  const userId = user?.userId || user?.uid || "";
  const isOrgAdmin = activeWorkspace.type === "organization" && activeWorkspace.role === "admin";
  const canViewHistory = activeWorkspace.type === "personal" || isOrgAdmin;

  useEffect(() => {
    async function loadLedgerData() {
      if (!userId) return;
      setLoadingLedger(true);
      const ownerType: "personal" | "org" = activeWorkspace.type === "organization" ? "org" : "personal";
      const ownerId = activeWorkspace.type === "personal" ? userId : activeWorkspace.id;

      try {
        const ledger = await fetchTokenLedger(ownerType, ownerId);
        setActiveLedger(ledger);

        if (canViewHistory) {
          const entries = await fetchLedgerEntries(ownerId, 15);
          setLedgerEntries(entries);
        } else {
          setLedgerEntries([]);
        }
      } catch (err) {
        console.warn("Could not fetch token ledger data:", err);
      } finally {
        setLoadingLedger(false);
      }
    }

    loadLedgerData();
  }, [activeWorkspace, userId, canViewHistory]);

  const currentBalance = activeLedger ? activeLedger.balance : (typeof user?.tokenBalance === "number" ? user.tokenBalance : 50);
  const currentTier = activeLedger?.tier || user?.tier || "free";
  const hasEverPaid = activeLedger ? activeLedger.hasEverPaid : user?.hasEverPaid === true;

  return (
    <div className="py-10 px-4 max-w-5xl mx-auto font-sans">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 text-white rounded-[2.5rem] p-8 md:p-10 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10 text-center md:text-left">
          <Avatar
            name={`${user.firstName} ${user.lastName}`}
            size="lg"
            className="w-24 h-24 text-2xl border-4 border-white/20 shadow-lg flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider">
                {currentTier} Plan
              </span>
              {activeWorkspace.type === "organization" && (
                <span className="px-3 py-1 rounded-full bg-indigo-500/40 border border-indigo-300/30 text-indigo-100 text-xs font-semibold flex items-center gap-1.5">
                  <LuBuilding className="w-3.5 h-3.5" />
                  <span>{activeWorkspace.name} ({activeWorkspace.role})</span>
                </span>
              )}
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight truncate">
              {capitalizeWords(`${user.firstName} ${user.lastName}`)}
            </h1>
            <p className="text-blue-100 text-sm font-medium mt-1 flex items-center justify-center md:justify-start gap-1.5">
              <LuMail className="w-4 h-4 opacity-75" />
              <span>{user.email}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsTopUpOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <LuPlus className="w-4 h-4 text-indigo-600 font-extrabold" />
              <span>Top Up Tokens</span>
            </button>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs transition-all text-center"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Token Balance Card */}
        <div className="md:col-span-1 bg-white border border-gray-200/90 rounded-[2.5rem] p-6 md:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <LuCoins className="w-4 h-4 text-indigo-600" /> Token Balance
              </span>

            </div>

            <div className="my-6">
              <span className="text-5xl font-extrabold text-gray-900 tracking-tight">
                {currentBalance}
              </span>
              <span className="text-xs font-semibold text-gray-400 block mt-1">
                Participant Tokens Available
              </span>
            </div>

            <div className="space-y-3 text-xs font-medium text-gray-600 border-t border-gray-100 pt-5">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">One-Time Free Grant:</span>
                <span className="font-bold text-gray-900">{user.freeTokensGranted || 50} tokens</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Paid Tokens Purchased:</span>
                <span className="font-bold text-indigo-600">{user.paidTokensPurchased || 0} tokens</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Overdraft Buffer:</span>
                <span className="font-bold text-emerald-600">
                  {hasEverPaid ? "-20 Buffer Enabled" : "None (Free Tier)"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsTopUpOpen(true)}
            className="w-full mt-6 py-3 px-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <LuCoins className="w-4 h-4" />
            <span>Buy Participant Tokens</span>
          </button>
        </div>

        {/* Account Details & Recent Transactions */}
        <div className="md:col-span-2 space-y-6">
          {/* Account Details Card */}
          <div className="bg-white border border-gray-200/90 rounded-[2.5rem] p-6 md:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <LuUser className="w-5 h-5 text-indigo-600" /> Account Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <span className="text-gray-400 font-semibold block mb-1">First Name</span>
                <span className="text-gray-900 font-bold text-sm">{user.firstName || "—"}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <span className="text-gray-400 font-semibold block mb-1">Last Name</span>
                <span className="text-gray-900 font-bold text-sm">{user.lastName || "—"}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <span className="text-gray-400 font-semibold block mb-1">Email Address</span>
                <span className="text-gray-900 font-bold text-sm truncate block">{user.email || "—"}</span>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                <span className="text-gray-400 font-semibold block mb-1">Account Tier</span>
                <span className="text-indigo-600 font-bold text-sm uppercase">{currentTier}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-gray-100">
              <Link
                href="/settings"
                className="px-5 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors flex items-center gap-2"
              >
                <LuCog className="w-4 h-4" />
                <span>Account Settings</span>
              </Link>
              {activeWorkspace.type === "organization" && activeWorkspace.role === "admin" && (
                <Link
                  href="/settings/org"
                  className="px-5 py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <LuBuilding className="w-4 h-4" />
                  <span>Organization Settings</span>
                </Link>
              )}
            </div>
          </div>

          {/* Token History Ledger */}
          <div className="bg-white border border-gray-200/90 rounded-[2.5rem] p-6 md:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <LuHistory className="w-4 h-4 text-indigo-600" /> Token History
              </h3>
              <Link href="/pricing" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
                Top Up <LuArrowUpRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingLedger ? (
              <div className="text-center py-6 text-xs text-gray-400 animate-pulse">Loading transaction history...</div>
            ) : !canViewHistory ? (
              <div className="text-center py-6 px-4 text-xs text-gray-500 font-medium bg-amber-50/60 rounded-2xl border border-amber-200/50">
                Organization token balance is shared across all members. Detailed transaction history is visible to Org Admins only.
              </div>
            ) : ledgerEntries.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500 font-medium bg-gray-50 rounded-2xl border border-gray-100">
                No recent token transactions recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {ledgerEntries.map((entry) => (
                  <div
                    key={entry.id || Math.random().toString()}
                    className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 hover:bg-gray-100/80 transition-colors text-xs"
                  >
                    <div>
                      <span className="font-bold text-gray-900 block capitalize">
                        {entry.type === "free_grant"
                          ? "Initial Free Grant"
                          : entry.type === "pack_purchase"
                            ? `Purchased Token Pack (${entry.packName || "Pack"})`
                            : "Participant Joined Event"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <span
                      className={`font-mono font-bold text-sm ${entry.amount > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                    >
                      {entry.amount > 0 ? `+${entry.amount}` : entry.amount} Tokens
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top-Up Purchase Modal */}
      <TokenPurchaseModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        userEmail={user.email}
        accountId={user.userId || user.uid}
        accountType={activeWorkspace.type === "organization" ? "org" : "user"}
      />
    </div>
  );
}
