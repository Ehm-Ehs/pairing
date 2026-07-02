"use client";

import { ChevronRightIcon } from "../ui/icons";

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
            <svg className="absolute inset-0 w-full h-full object-cover opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
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
            <div className="flex flex-row items-center justify-center gap-3.5 w-full max-w-xl mx-auto px-2">
              <button
                onClick={onGetStarted}
                className="flex-1 max-w-[240px] px-6 py-4 text-[13px] sm:text-[15px] font-semibold text-white bg-gradient-to-r from-[#205BE2] via-[#1A4ED8] to-[#0A389D] rounded-full hover:from-[#1b4ec2] hover:to-[#082f85] transition-all shadow-lg shadow-[#1D4ED8]/20 flex items-center justify-center gap-2.5 whitespace-nowrap active:scale-[0.98]"
              >
                Create your first event
                <ChevronRightIcon className="w-2 h-3.5 flex-shrink-0 text-white" />
              </button>
              <button
                onClick={scrollToHowItWorks}
                className="flex-1 max-w-[180px] px-6 py-4 text-[13px] sm:text-[15px] font-semibold text-[#000000] bg-gradient-to-b from-[#F2F2F3] to-[#E5E6E8] border border-white/40 rounded-full hover:from-[#e9e9eb] hover:to-[#dadbdc] transition-all shadow-sm flex items-center justify-center whitespace-nowrap active:scale-[0.98]"
              >
                See how it works
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
