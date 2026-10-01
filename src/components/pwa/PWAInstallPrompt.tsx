"use client";

import React, { useState, useEffect } from "react";
import { FiDownload, FiX, FiShare, FiPlusSquare, FiSmartphone } from "react-icons/fi";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [appName, setAppName] = useState<string>("PairForm");

  useEffect(() => {
    // Check hostname / environment for staging vs production branding
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname.toLowerCase();
      const isStaging =
        hostname.includes("staging") ||
        hostname.includes("stag") ||
        process.env.NEXT_PUBLIC_APP_ENV === "staging";
      setAppName(isStaging ? "Pairform-stag" : "PairForm");
    }

    // Check if user previously dismissed prompt in the last 7 days
    const dismissedTime = localStorage.getItem("pairform_pwa_dismissed");
    if (dismissedTime) {
      const now = Date.now();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (now - parseInt(dismissedTime, 10) < sevenDays) {
        return;
      }
    }

    // Check if app is already running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // Delay showing iOS banner slightly for smooth UX
      const timer = setTimeout(() => setShowBanner(true), 2500);
      return () => clearTimeout(timer);
    }

    // Android & Desktop Chrome / Edge prompt event listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pairform_pwa_dismissed", Date.now().toString());
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Floating Bottom PWA Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-inner">
              <FiSmartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white leading-snug">
                Install {appName} App
              </h4>
              <p className="text-xs text-slate-300">
                Faster access & offline support on your home screen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <FiDownload className="w-3.5 h-3.5" />
              Install
            </button>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-slate-900 relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 mx-auto">
              <FiSmartphone className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-bold text-center text-slate-900 mb-2">
              Install {appName} on iOS
            </h3>
            <p className="text-xs text-slate-600 text-center mb-6">
              Follow these simple steps in Safari to add {appName} to your iPhone or iPad home screen:
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div className="pt-0.5">
                  Tap the <span className="font-semibold text-slate-900">Share</span> button in Safari&apos;s toolbar. <FiShare className="inline w-3.5 h-3.5 text-blue-600 ml-1" />
                </div>
              </div>

              <div className="flex items-start gap-3 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div className="pt-0.5">
                  Scroll down and tap <span className="font-semibold text-slate-900">Add to Home Screen</span>. <FiPlusSquare className="inline w-3.5 h-3.5 text-blue-600 ml-1" />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowIOSModal(false);
                handleDismiss();
              }}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
