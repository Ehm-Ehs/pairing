"use client";

import { DiagonalArrowIcon } from "../ui/icons";

export default function UseCases() {
  return (
    <section id="use-cases" className="py-24 bg-white relative overflow-hidden">
      {/* Background container for the green glow SVG only - no blue blueprint lines */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="relative  mx-auto h-full px-4 sm:px-6 lg:px-8">
          <div className="absolute top-[-30px] right-[-30px] w-[259px] h-[277px] opacity-75">
            <svg className="w-full h-full" viewBox="0 0 259 277" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_f_277_986)">
                <rect x="143.947" y="-149.439" width="399.772" height="202.817" rx="101.409" transform="rotate(47.7232 143.947 -149.439)" stroke="#34C759" strokeWidth="23.4471" />
              </g>
              <defs>
                <filter id="filter0_f_277_986" x="0" y="-143.32" width="406.761" height="419.992" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="12" result="effect1_foregroundBlur_277_986" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#EBF1FF] text-[#0B51D8] text-xs font-semibold mb-6 tracking-wide shadow-sm">
            Use cases
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-[1.15] tracking-tight mb-4">
            Works for <span className="font-serif italic font-normal text-gray-800">any setting</span>
          </h2>
          <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed max-w-2xl font-medium">
            Whether you're running a hackathon or a classroom exercise, PairForm handles the logistics so you can focus on the event.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          {/* Card 1 */}
          <div className="group relative bg-gradient-to-br from-white to-[#DCE8FF] border border-[#C9DBFF] rounded-[1.5rem] p-8 flex flex-col justify-between shadow-sm hover:shadow-[0_12px_40px_rgba(37,99,235,0.06)] transition-all duration-300 ease-out md:col-span-5 min-h-[220px]">
            <div className="flex justify-between items-start gap-4">
              <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed font-medium max-w-[82%]">
                Form balanced teams with the right skill mix. Enforce role caps so every team has developers, designers, and product people. Handle last-minute additions without reshuffling everything.
              </p>
              <div className="w-10 h-10 rounded-full bg-[#0B51D8] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300 cursor-pointer">
                <DiagonalArrowIcon className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-12">Hackathons & Competitions</h3>
          </div>

          {/* Card 2 */}
          <div className="group relative bg-gradient-to-br from-white to-[#D5F5DC] border border-[#C2EFC7] rounded-[1.5rem] p-8 flex flex-col justify-between shadow-sm hover:shadow-[0_12px_40px_rgba(34,197,94,0.06)] transition-all duration-300 ease-out md:col-span-7 min-h-[220px]">
            <div className="flex justify-between items-start gap-4">
              <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed font-medium max-w-[85%]">
                Create project groups for courses and workshops. Ensure every team has the diversity of skills your curriculum requires. Works for classes of 10 or 200.
              </p>
              <div className="w-10 h-10 rounded-full bg-[#0B51D8] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300 cursor-pointer">
                <DiagonalArrowIcon className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-12">Educational Settings</h3>
          </div>

          {/* Card 3 */}
          <div className="group relative bg-gradient-to-br from-white to-[#FFE0D8] border border-[#FFD0C2] rounded-[1.5rem] p-8 flex flex-col justify-between shadow-sm hover:shadow-[0_12px_40px_rgba(249,115,22,0.06)] transition-all duration-300 ease-out md:col-span-7 min-h-[220px]">
            <div className="flex justify-between items-start gap-4">
              <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed font-medium max-w-[85%]">
                Form cross-functional teams for training sessions, strategy workshops, and team-building activities. Automatic role balancing across departments.
              </p>
              <div className="w-10 h-10 rounded-full bg-[#0B51D8] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300 cursor-pointer">
                <DiagonalArrowIcon className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-12">Corporate Workshops</h3>
          </div>

          {/* Card 4 */}
          <div className="group relative bg-gradient-to-br from-white to-[#F1D5FF] border border-[#EECEFF] rounded-[1.5rem] p-8 flex flex-col justify-between shadow-sm hover:shadow-[0_12px_40px_rgba(168,85,247,0.06)] transition-all duration-300 ease-out md:col-span-5 min-h-[220px]">
            <div className="flex justify-between items-start gap-4">
              <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed font-medium max-w-[82%]">
                Replace the hat-draw chaos. Everyone registers, the organizer generates pairs in one click, and matches are revealed privately. Simple, fair, fun.
              </p>
              <div className="w-10 h-10 rounded-full bg-[#0B51D8] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300 cursor-pointer">
                <DiagonalArrowIcon className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-8 sm:mt-12">Secret Santa & Gifting</h3>
          </div>
        </div>
      </div>
    </section>
  );
}
