"use client";

import Logo from "../../assets/logo";

interface FooterProps {
  scrollToHowItWorks: () => void;
  scrollToUseCases: () => void;
  scrollToFeatures: () => void;
}

export default function Footer({
  scrollToHowItWorks,
  scrollToUseCases,
  scrollToFeatures,
}: FooterProps) {
  return (
    <footer className="bg-[#2563eb] pt-20 pb-10 border-t border-[#1d4ed8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Left Col */}
          <div className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center mb-6">
              <Logo className="h-9 w-auto" variant="white" />
            </div>
            <p className="text-blue-100 text-[15px] max-w-sm leading-relaxed font-medium">
              Smart group formation for workshops, hackathons, Secret Santa, and everything in between.
            </p>
          </div>

          {/* Middle Col */}
          <div className="md:col-span-3 text-center md:text-left">
            <h4 className="text-white font-bold mb-6 text-lg">Product</h4>
            <ul className="space-y-4 text-[15px] text-blue-100 font-medium animate-none">
              <li>
                <a
                  href="#how-it-works"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToHowItWorks();
                  }}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToFeatures();
                  }}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#use-cases"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToUseCases();
                  }}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  Uses cases
                </a>
              </li>
            </ul>
          </div>

          {/* Right Col */}
          <div className="md:col-span-3 text-center md:text-left">
            <h4 className="text-white font-bold mb-6 text-lg">Use Cases</h4>
            <ul className="space-y-4 text-[15px] text-blue-100 font-medium">
              <li>
                <a
                  href="#use-cases"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToUseCases();
                  }}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  Secret Santa
                </a>
              </li>
              <li>
                <a
                  href="#use-cases"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToUseCases();
                  }}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  Team workshops
                </a>
              </li>
              <li>
                <a
                  href="#use-cases"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToUseCases();
                  }}
                  className="hover:text-white transition-colors cursor-pointer block"
                >
                  Group formation
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-[#3b82f6] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sm text-blue-200">
            © 2026 PairForm. No spreadsheets. No manual pairing. Just balanced groups.
          </p>
          <p className="text-sm text-blue-200">
            Built for real events.
          </p>
        </div>
      </div>
    </footer>
  );
}
