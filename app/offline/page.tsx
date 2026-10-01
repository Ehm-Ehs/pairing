"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiWifiOff, FiRefreshCw, FiHome, FiCheckCircle } from "react-icons/fi";

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setIsChecking(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center relative overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-50/80 rounded-full blur-2xl pointer-events-none" />

        {/* Offline Icon Badge */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-sm">
          {isOnline ? (
            <FiCheckCircle className="w-10 h-10 text-emerald-600 animate-bounce" />
          ) : (
            <FiWifiOff className="w-10 h-10 text-blue-600 animate-pulse" />
          )}
        </div>

        {/* Title & Status */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          {isOnline ? "You're Back Online!" : "You Are Currently Offline"}
        </h1>

        <p className="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed">
          {isOnline
            ? "Your connection has been restored. Tap below to refresh your PairForm session."
            : "PairForm is saved on your device for fast loading. Connect to the internet to create new events or generate pairings."}
        </p>

        {/* Connection Status Indicator Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8 bg-slate-100 text-slate-700">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? "bg-emerald-500 animate-ping" : "bg-amber-500"
            }`}
          />
          {isOnline ? "Connection Restored" : "Offline Mode Active"}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-75"
          >
            <FiRefreshCw className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Checking Connection..." : "Try Reconnecting"}
          </button>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all active:scale-[0.98]"
          >
            <FiHome className="w-4 h-4 text-slate-500" />
            Go to Homepage
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-6 font-medium">
        PairForm Progressive Web App &bull; Offline Storage Enabled
      </p>
    </div>
  );
}
