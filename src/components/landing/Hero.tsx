"use client";

import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

interface HeroProps {
  scrollToHowItWorks: () => void;
  onGetStarted?: () => void;
}

export default function Hero({ scrollToHowItWorks, onGetStarted }: HeroProps) {
  return (
    <div className="relative flex flex-col items-center justify-center text-center pt-16 pb-32 md:pt-24 md:pb-48 overflow-hidden mx-auto bg-gradient-to-b from-[#99bbff] via-[#e6efff] to-white mt-2 border border-gray-100/50">
      {/* Perspective Grid Background */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <svg className="absolute inset-0 w-full h-full object-cover opacity-60" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="vectorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8a8a8a" />
              <stop offset="100%" stopColor="#f0f0f0" />
            </linearGradient>
          </defs>
          <g stroke="url(#vectorGradient)" strokeWidth="1" fill="none">
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

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center px-4">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-blue-100 text-blue-500 text-xs sm:text-sm font-medium mb-8 shadow-sm">
          <span className="flex w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Smart automated balancing. Fair groups. Zero chaos.
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight text-black mb-4 max-w-4xl leading-[1.1]">
          Event formation,<br />
          <span className="font-serif italic text-[#1a56db] font-normal tracking-normal">finally effortless.</span>
        </h1>
        <p className="text-lg md:text-[1.1rem] text-gray-600 max-w-2xl mb-10 leading-relaxed font-medium">
          Effortlessly organize workshops, classes, and events. Create Balanced
          Groups in Minutes<br className="hidden md:block" /> No spreadsheets. No chaos. Just seamless, automated
          team formation with role<br className="hidden md:block" /> balancing built in seconds, not hours.
        </p>

        <div className="flex flex-row items-center justify-center gap-3 mb-8 w-full max-w-lg px-2">
          <button
            onClick={onGetStarted}
            className="flex-1 max-w-[200px] px-4 py-3 sm:px-6 sm:py-3.5 text-[12px] sm:text-sm md:text-base font-semibold text-white bg-[#1a56db] rounded-full hover:bg-blue-800 transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            Create your first event <FaArrowRight className="w-3 h-3 flex-shrink-0" />
          </button>
          <button
            onClick={scrollToHowItWorks}
            className="flex-1 max-w-[160px] px-4 py-3 sm:px-6 sm:py-3.5 text-[12px] sm:text-sm md:text-base font-semibold text-gray-800 bg-[#E5E7EB] rounded-full hover:bg-gray-300 transition-all flex items-center justify-center whitespace-nowrap"
          >
            See how it works
          </button>
        </div>

        <div className="flex items-center gap-3 text-[13px] text-gray-600 font-medium">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <img
                key={i}
                className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                src={`https://images.unsplash.com/photo-1534430480872-3498384e54e5?auto=format&fit=crop&w=100&q=80`}
                alt=""
              />
            ))}
          </div>
          <span>Setup takes under 2 minutes. No account needed for participants.</span>
        </div>
      </div>
    </div>
  );
}
