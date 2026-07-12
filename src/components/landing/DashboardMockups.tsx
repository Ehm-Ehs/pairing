"use client";

import { FaTimes } from "react-icons/fa";

export default function DashboardMockups() {
  return (
    <div className="relative z-20 w-full max-w-5xl mx-auto -mt-24 lg:-mt-32 pointer-events-none select-none h-auto lg:h-[400px] px-4 md:px-0">
      {/* Left Card: Group 1 */}
      <div className="hidden lg:block absolute left-0 lg:-left-4 xl:-left-12 top-12 z-20 w-[360px] bg-[#f8f9fb] rounded-[24px] p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-gray-200/60 text-left">
        <div className="flex justify-between items-center mb-4 px-2">
          <p className="text-lg font-bold text-gray-900">Group 1</p>
          <span className="text-xs font-semibold text-gray-600">5/5 members</span>
        </div>
        <div className="space-y-3">
          {[
            { name: "Amaka Okonkwo", email: "amaka.o@gmail.com", avatar: "/avatars/avatar1.png" },
            { name: "Tunde Adeyemi", email: "tunde.ade@gmail.com", avatar: "/avatars/avatar2.png" },
            { name: "Chidinma Eze", email: "chidi.eze@outlook.com", avatar: "/avatars/avatar3.png" },
            { name: "Emeka Nwosu", email: "e.nwosu@gmail.com", avatar: "/avatars/avatar4.png" },
            { name: "Seun Balogun", email: "seun.b@yahoo.com", avatar: "/avatars/avatar5.png" },
          ].map((user, i) => (
            <div key={i} className="flex items-center justify-between bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover shadow-sm" />
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">{user.name}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{user.email}</p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full border-2 border-gray-250 flex items-center justify-center text-gray-400">
                <FaTimes className="w-2.5 h-2.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Card Wrapper */}
      <div className="relative w-full max-w-[580px] mx-auto lg:mx-0 lg:absolute lg:-right-4 xl:-right-12 lg:top-0 z-10">
        {/* Right Card: Live Event Dashboard */}
        <div className="w-full bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-200/60 overflow-hidden text-left flex flex-col">
          {/* Window header */}
          <div className="bg-[#f8f9fb] px-4 py-3.5 flex items-center gap-2 border-b border-gray-100">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
              <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <p className="text-xs font-semibold text-gray-600 mx-auto mr-14">Live Event Dashboard</p>
          </div>
          
          <div className="p-5 sm:p-7">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Startup Weekend Hackathon</h2>
            <p className="text-[11px] sm:text-xs text-gray-600 mt-1.5 font-semibold">42 of 60 slots filled · 3 groups complete</p>
 
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
              <div className="bg-[#f4f6fa] rounded-2xl p-2.5 sm:p-3.5 text-center border border-gray-100">
                <p className="text-lg sm:text-xl font-bold text-blue-700 mb-1">42</p>
                <p className="text-[10px] sm:text-xs text-gray-600 font-semibold">Joined</p>
              </div>
              <div className="bg-[#f4f6fa] rounded-2xl p-2.5 sm:p-3.5 text-center border border-gray-100">
                <p className="text-lg sm:text-xl font-bold text-green-650 mb-1">3</p>
                <p className="text-[10px] sm:text-xs text-gray-600 font-semibold">Complete</p>
              </div>
              <div className="bg-[#f4f6fa] rounded-2xl p-2.5 sm:p-3.5 text-center border border-gray-100">
                <p className="text-lg sm:text-xl font-bold text-red-600 mb-1">18</p>
                <p className="text-[10px] sm:text-xs text-gray-600 font-semibold">Open</p>
              </div>
            </div>
 
            <div className="mt-6 space-y-3 sm:space-y-4">
              {/* Group 1 */}
              <div className="border border-gray-100 rounded-2xl p-3.5 sm:p-4 shadow-sm relative bg-white">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs sm:text-[13px] font-bold text-gray-800">Group 1</p>
                  <span className="text-[9px] sm:text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">Complete</span>
                </div>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">Dev</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">Dev</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">Designer</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">PM</span>
                </div>
              </div>
              {/* Group 2 */}
              <div className="border border-gray-100 rounded-2xl p-3.5 sm:p-4 shadow-sm relative bg-white">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs sm:text-[13px] font-bold text-gray-850">Group 2</p>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#b23b00] bg-[#fff0db] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">2 of 4</span>
                </div>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">Dev</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">Dev</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700 bg-gray-250 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">Designer</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700 bg-gray-250 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">PM</span>
                </div>
              </div>
              {/* Group 3 */}
              <div className="border border-gray-100 rounded-2xl p-3.5 sm:p-4 shadow-sm relative bg-white">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs sm:text-[13px] font-bold text-gray-800">Group 3</p>
                  <span className="text-[9px] sm:text-[10px] font-bold text-[#b23b00] bg-[#fff0db] px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full">1 of 4</span>
                </div>
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">Dev</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700 bg-gray-250 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">Dev</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700 bg-gray-250 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">Designer</span>
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-700 bg-gray-250 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg">PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        {/* Floating Empty Slot Popup */}
        <div className="absolute right-[-4px] sm:right-[-10px] lg:-right-10 xl:-right-16 top-[-24px] sm:top-[-30px] z-30 w-[200px] sm:w-[260px] bg-[#f8f9fb] rounded-2xl p-3 sm:p-4 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.15)] border border-gray-200/80 text-left">
          <p className="text-[10px] sm:text-[11px] font-bold text-gray-900 mb-2.5">Position #3</p>
          <div className="bg-white rounded-xl p-2 sm:p-2.5 border border-gray-100 flex items-center gap-2.5 sm:gap-3 shadow-sm">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex-shrink-0"></div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-gray-800">Empty slot</p>
              <p className="text-[9px] sm:text-[10px] text-gray-600 mt-0.5 font-semibold">Available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
