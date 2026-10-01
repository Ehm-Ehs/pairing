"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "../../assets/logo";
import { FaBars, FaTimes } from "react-icons/fa";

interface NavbarProps {
  scrollToHowItWorks?: () => void;
  scrollToUseCases?: () => void;
  scrollToFeatures?: () => void;
  scrollToPricing?: () => void;
  onGetStarted?: () => void;
}

export default function Navbar({
  scrollToHowItWorks,
  scrollToUseCases,
  scrollToFeatures,
  scrollToPricing,
  onGetStarted,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    hash: string,
    scrollFn?: () => void
  ) => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      e.preventDefault();
      if (scrollFn) {
        scrollFn();
      } else {
        const el = document.getElementById(hash);
        el?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="relative flex items-center justify-between px-4 py-4 md:px-8 max-w-7xl mx-auto z-50">
      <Link href="/">
        <div className="flex items-center py-2 cursor-pointer">
          <Logo className="h-9 w-auto" />
        </div>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex gap-6 lg:gap-8 items-center absolute left-1/2 transform -translate-x-1/2">

        <a
          href="/#how-it-works"
          onClick={(e) => handleNavClick(e, "how-it-works", scrollToHowItWorks)}
          className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          How it Works
        </a>
        <a
          href="/#features"
          onClick={(e) => handleNavClick(e, "features", scrollToFeatures)}
          className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Features
        </a>
        <a
          href="/#use-cases"
          onClick={(e) => handleNavClick(e, "use-cases", scrollToUseCases)}
          className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Use cases
        </a>
        <a
          href="/#pricing"
          onClick={(e) => handleNavClick(e, "pricing", scrollToPricing)}
          className="text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Pricing
        </a>
      </div>

      {/* Right Buttons */}
      <div className="hidden md:flex gap-3 items-center">
        <Link
          href="/login"
          className="px-6 py-2 text-[13px] font-medium text-gray-900 bg-[#E5E7EB] rounded-full hover:bg-gray-300 transition-colors"
        >
          Login
        </Link>
        <Link
          href="/create-event"
          onClick={onGetStarted}
          className="px-6 py-2 text-[13px] font-medium text-white bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] border border-blue-600 rounded-full hover:from-[#2563eb] hover:to-[#1e40af] transition-colors shadow-sm flex items-center justify-center"
        >
          Get started
        </Link>
      </div>

      {/* Mobile Menu & Get Started */}
      <div className="flex md:hidden gap-2 items-center">
        <Link
          href="/create-event"
          onClick={onGetStarted}
          className="px-4 py-2 text-[13px] font-semibold text-white bg-[#1D4ED8] rounded-full hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
        >
          Get started
        </Link>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
          className="p-2.5 bg-gray-50 border border-gray-200 text-[#1D4ED8] rounded-xl hover:bg-gray-100 transition-colors focus:outline-none flex items-center justify-center"
        >
          {isMenuOpen ? (
            <FaTimes size={18} />
          ) : (
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 2H18M0 10H18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-b-lg border-t border-gray-100 p-4 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-2">

          <a
            href="/#how-it-works"
            onClick={(e) => {
              handleNavClick(e, "how-it-works", scrollToHowItWorks);
              setIsMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-gray-600"
          >
            How it Works
          </a>
          <a
            href="/#features"
            onClick={(e) => {
              handleNavClick(e, "features", scrollToFeatures);
              setIsMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-gray-600"
          >
            Features
          </a>
          <a
            href="/#use-cases"
            onClick={(e) => {
              handleNavClick(e, "use-cases", scrollToUseCases);
              setIsMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-gray-600"
          >
            Use cases
          </a>
          <a
            href="/#pricing"
            onClick={(e) => {
              handleNavClick(e, "pricing", scrollToPricing);
              setIsMenuOpen(false);
            }}
            className="text-left text-sm font-medium text-gray-600"
          >
            Pricing
          </a>
          <Link
            href="/login"
            className="px-4 py-3 text-center text-sm font-medium text-gray-800 bg-[#E5E7EB] rounded-full transition-colors"
            onClick={() => setIsMenuOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/create-event"
            onClick={() => {
              setIsMenuOpen(false);
              onGetStarted?.();
            }}
            className="px-4 py-3 text-center text-sm font-medium text-white bg-[#2563EB] rounded-full transition-colors shadow-sm flex items-center justify-center"
          >
            Get started
          </Link>
        </div>
      )}
    </nav>
  );
}
