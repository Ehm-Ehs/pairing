"use client";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#f0f5ff] text-[#1a56db] text-sm font-medium mb-6">
            How it works
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Four steps to creating <span className="font-serif italic font-normal text-gray-800">perfectly balanced events</span>
          </h2>
          <p className="text-gray-500 text-[15px] md:text-[17px] leading-relaxed font-medium">
            No training required. No onboarding call. Just four steps and you're live.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute top-[2rem] left-[12.5%] w-[75%] h-[1px] bg-gray-200 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 relative z-10">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[#1a56db] text-white flex items-center justify-center text-[1.35rem] font-bold mb-6">
                1
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-3">Define your event</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed font-medium px-2">
                Set the number of groups, participants per group, and roles needed. PairForm validates
                everything automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-white text-gray-900 border border-gray-200 flex items-center justify-center text-[1.35rem] font-bold mb-6">
                2
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-3">Get your structure</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed font-medium px-2">
                PairForm generates balanced group slots with role caps enforced. The framework is
                ready before anyone joins.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-white text-gray-900 border border-gray-200 flex items-center justify-center text-[1.35rem] font-bold mb-6">
                3
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-3">Share one link</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed font-medium px-2">
                Copy and send the join link. Participants click it, pick their role, and are assigned to a group
                instantly. No login needed.
              </p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-white text-gray-900 border border-gray-200 flex items-center justify-center text-[1.35rem] font-bold mb-6">
                4
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-3">Watch it fill live</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed font-medium px-2">
                Our dashboard updates in real time. See which groups are complete, which need
                roles, and who joined when.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
