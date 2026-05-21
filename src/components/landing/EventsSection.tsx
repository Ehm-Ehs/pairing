"use client";

import { LuLock, LuUsers, LuChartBar } from "react-icons/lu";

export default function EventsSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 max-w-2xl">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white text-[#1d4ed8] text-sm font-medium mb-6">
            Events
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight mb-4">
            One tool, <span className="font-serif italic font-normal text-white/90">every format</span>
          </h2>
          <p className="text-blue-100 text-[15px] md:text-[17px] leading-relaxed font-medium">
            PairForm adapts to how your event actually works — not the other way around.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 md:p-10 border border-white/20 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-[#3b82f6] rounded-xl flex items-center justify-center mb-6 shadow-sm flex-shrink-0">
              <LuLock className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <h3 className="font-bold text-white text-[1.35rem] mb-3">Group Events</h3>
            <p className="text-[14px] text-white/80 leading-relaxed font-medium">
              Balanced teams with defined roles. Each group gets exactly the mix you specify.
              Developers, designers, PMs — whatever your event needs.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 md:p-10 border border-white/20 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-[#22c55e] rounded-xl flex items-center justify-center mb-6 shadow-sm flex-shrink-0">
              <LuUsers className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <h3 className="font-bold text-white text-[1.35rem] mb-3">Single Pairings</h3>
            <p className="text-[14px] text-white/80 leading-relaxed font-medium">
              Perfect for Secret Santa, speed networking, and mentorship matching. Participants
              register, then the organizer generates random pairs in one click.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 md:p-10 border border-white/20 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-[#d946ef] rounded-xl flex items-center justify-center mb-6 shadow-sm flex-shrink-0">
              <LuChartBar className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <h3 className="font-bold text-white text-[1.35rem] mb-3">Random Positions</h3>
            <p className="text-[14px] text-white/80 leading-relaxed font-medium">
              Numbered slot assignment without roles. Participants choose any available position.
              Great for seating assignments and simple groupings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
