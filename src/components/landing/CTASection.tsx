"use client";

import { FaArrowRight } from "react-icons/fa";
import { Button } from "../ui/button";

interface CTASectionProps {
  onGetStarted: () => void;
  scrollToHowItWorks: () => void;
}

export default function CTASection({
  onGetStarted,
  scrollToHowItWorks,
}: CTASectionProps) {
  return (
    <section className="pt-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-b from-[#99bbff] via-[#e6efff] to-white rounded-[2.5rem] overflow-hidden px-6 py-24 md:py-32 text-center border border-gray-100/50">

          {/* Perspective Grid Background */}
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <svg className="absolute inset-0 w-full h-full object-cover opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="ctaVectorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8a8a8a" />
                  <stop offset="100%" stopColor="#f0f0f0" />
                </linearGradient>
              </defs>
              <g stroke="url(#ctaVectorGradient)" strokeWidth="1" fill="none">
                {/* 12 Radiating lines from center */}
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="0" y2="0" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="100" y2="0" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="100" y2="100" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="0" y2="100" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="25" y2="0" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="75" y2="0" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="25" y2="100" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="75" y2="100" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="50" y2="0" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="50" y2="100" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="0" y2="50" />
                <line vectorEffect="non-scaling-stroke" x1="50" y1="50" x2="100" y2="50" />
                {/* Concentric Rectangles */}
                {[0.04, 0.09, 0.16, 0.26, 0.4, 0.58, 0.8, 1.1, 1.5].map((s, i) => (
                  <rect key={i} vectorEffect="non-scaling-stroke" x={50 - 50 * s} y={50 - 50 * s} width={100 * s} height={100 * s} />
                ))}
              </g>
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-[4rem] font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
              Ready to run <span className="font-serif italic font-normal text-[#1d4ed8]">your first event?</span>
            </h2>
            <p className="text-gray-500 text-[15px] md:text-[17px] font-medium mb-10">
              Set up in under 2 minutes. No credit card. No learning curve. Just balanced groups, automatically.
            </p>
            <div className="flex flex-row items-center justify-center gap-3 w-full max-w-lg mx-auto px-2">
              <Button
                onClick={onGetStarted}
                className="flex-1 max-w-[200px] rounded-full bg-[#1d4ed8] text-white hover:bg-blue-800 px-3 sm:px-6 py-5 sm:py-6 text-[12px] sm:text-base font-semibold shadow-sm whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                Create your first event <FaArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
              </Button>
              <Button
                onClick={scrollToHowItWorks}
                variant="secondary"
                className="flex-1 max-w-[160px] rounded-full bg-gray-200/80 text-gray-800 hover:bg-gray-300 px-3 sm:px-6 py-5 sm:py-6 text-[12px] sm:text-base font-semibold whitespace-nowrap flex items-center justify-center"
              >
                See how it works
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
