import {
  CircleXFilledOrangeIcon,
  CalendarCustomIcon,
  CircleXFilledPinkIcon,
} from "../../components/ui/icons";

export default function ProblemSection() {
  return (
    <section className="py-20 lg:py-28 bg-[#f8f9fb] relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 pointer-events-none z-0">
        <svg width="263" height="294" viewBox="0 0 263 294" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_f_277_845)">
            <rect x="143.947" y="-132.439" width="399.772" height="202.817" rx="101.409" transform="rotate(47.7232 143.947 -132.439)" stroke="#FF9777" strokeWidth="23.4471" />
          </g>
          <defs>
            <filter id="filter0_f_277_845" x="0" y="-126.32" width="406.761" height="419.994" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="12" result="effect1_foregroundBlur_277_845" />
            </filter>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Text Content */}
        <div className="mb-12">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#f0f5ff] text-[#1a56db] text-sm font-medium mb-6">
            The problem
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-[1.1] tracking-tight mb-2">
            Manual grouping is<br />
            <span className="font-serif italic font-normal text-gray-800">costing you hours</span>
          </h2>
          <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed max-w-2xl mt-6 font-medium">
            Every organizer knows the pain. The spreadsheet. The back-and-forth. The last-minute
            changes. The panicked reshuffling when someone drops out.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: 3 Problem Cards */}
          <div className="flex flex-col gap-4">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-start">
              <div className="bg-[#fff1ed] text-[#ff7e67] shadow-[0_4px_12px_rgba(255,126,103,0.18)] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                <CircleXFilledOrangeIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-1">Hours lost to manual sorting</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                  Assigning people to balanced groups by hand is tedious, error-prone, and never fast enough when you're running an event.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-start">
              <div className="bg-[#eff4ff] text-[#3b82f6] shadow-[0_4px_12px_rgba(59,130,246,0.18)] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                <CalendarCustomIcon className="w-6 h-6 text-[#0F48BC]" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-1">Constant updates as people join</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                  Late registrations, role changes, and no-shows mean your carefully built spreadsheet is outdated before the event starts
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex gap-4 items-start">
              <div className="bg-[#fcf0ff] text-[#d946ef] shadow-[0_4px_12px_rgba(217,70,239,0.18)] w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                <CircleXFilledPinkIcon className="w-6.5 h-6.5 text-[#CF0ABE]" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-[15px] mb-1">Duplicate assignments and conflicts</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed font-medium">
                  Without automatic slot locking, two people can end up in the same role or group — and you only find out during the event.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Before/After Workflow */}
          <div className="bg-white rounded-[2rem] p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col gap-4">
              {/* Row 1 */}
              <div className="flex flex-row items-stretch gap-2 sm:gap-4">
                <div className="flex-1 bg-[#fef2f2] text-[#b91c1c] line-through rounded-xl p-3 sm:p-4 text-[10px] sm:text-[13px] font-semibold text-left font-sans leading-snug flex items-center">
                  Sorting names in a spreadsheet for 2 hours
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1 bg-[#f0fdf4] text-[#15803d] rounded-xl p-3 sm:p-4 text-[10px] sm:text-[13px] font-semibold text-left font-sans leading-snug flex items-center">
                  Event structure generated in seconds
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex flex-row items-stretch gap-2 sm:gap-4">
                <div className="flex-1 bg-[#fef2f2] text-[#b91c1c] line-through rounded-xl p-3 sm:p-4 text-[10px] sm:text-[13px] font-semibold text-left font-sans leading-snug flex items-center">
                  Manually emailing group assignments
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1 bg-[#f0fdf4] text-[#15803d] rounded-xl p-3 sm:p-4 text-[10px] sm:text-[13px] font-semibold text-left font-sans leading-snug flex items-center">
                  Participants self-assign via shared link
                </div>
              </div>

              {/* Row 3 */}
              <div className="flex flex-row items-stretch gap-2 sm:gap-4">
                <div className="flex-1 bg-[#fef2f2] text-[#b91c1c] line-through rounded-xl p-3 sm:p-4 text-[10px] sm:text-[13px] font-semibold text-left font-sans leading-snug flex items-center">
                  Reshuffling when someone drops out
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1 bg-[#f0fdf4] text-[#15803d] rounded-xl p-3 sm:p-4 text-[10px] sm:text-[13px] font-semibold text-left font-sans leading-snug flex items-center">
                  Slot opens instantly, next person fills it
                </div>
              </div>

              {/* Row 4 */}
              <div className="flex flex-row items-stretch gap-2 sm:gap-4">
                <div className="flex-1 bg-[#fef2f2] text-[#b91c1c] line-through rounded-xl p-3 sm:p-4 text-[10px] sm:text-[13px] font-semibold text-left font-sans leading-snug flex items-center">
                  Messy Secret Santa name draw
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="flex-1 bg-[#f0fdf4] text-[#15803d] rounded-xl p-3 sm:p-4 text-[10px] sm:text-[13px] font-semibold text-left font-sans leading-snug flex items-center">
                  Pairs generated randomly in one click
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
