"use client";

import {
  LockIcon,
  SinglePairingIcon,
  DashboardMonitorIcon,
  LinkedRingsIcon,
  OrganizerPairingCursorIcon,
  DocumentFoldedIcon,
} from "../ui/icons";

export default function FeaturesSection() {
  const features = [
    {
      title: "Auto-locking slots",
      description: "Once a spot is claimed, it's locked immediately. No double assignments, no race conditions, no two people landing in the same slot.",
      icon: <LockIcon className="w-[18px] h-[25px] text-white" />,
      bgColor: "bg-[#3A76F0]",
      shadowClass: "shadow-[0_8px_20px_rgba(58,118,240,0.45)]",
    },
    {
      title: "Role caps per group",
      description: "Need exactly 1 leader and 2 engineers per team? Define it once and PairForm enforces it for every group automatically.",
      icon: <SinglePairingIcon className="w-[25px] h-[25px] text-white" />,
      bgColor: "bg-[#22c55e]",
      shadowClass: "shadow-[0_8px_20px_rgba(34,197,94,0.45)]",
    },
    {
      title: "Real-time dashboard",
      description: "Watch groups fill as participants join. Spot gaps instantly and decide whether to remove, reassign, or close the event.",
      icon: <DashboardMonitorIcon className="w-[24px] h-[23px] text-white" />,
      bgColor: "bg-[#d946ef]",
      shadowClass: "shadow-[0_8px_20px_rgba(217,70,239,0.45)]",
    },
    {
      title: "Single shareable link",
      description: "One link does everything. Share it in a message, on a slide, or as a QR code. Participants join in seconds with no account needed.",
      icon: <LinkedRingsIcon className="w-[28px] h-[28px] text-white" />,
      bgColor: "bg-[#f97316]",
      shadowClass: "shadow-[0_8px_20px_rgba(249,115,22,0.45)]",
    },
    {
      title: "Organizer-controlled pairing",
      description: "For secret pairings, participants register first. The organizer then generates matches in one click when everyone's ready.",
      icon: <OrganizerPairingCursorIcon className="w-[23px] h-[23px] text-white" />,
      bgColor: "bg-[#6366f1]",
      shadowClass: "shadow-[0_8px_20px_rgba(99,102,241,0.45)]",
    },
    {
      title: "CSV export",
      description: "Download all participant data and group assignments at any time. Your data, in your hands, in a format that works everywhere.",
      icon: <DocumentFoldedIcon className="w-[17px] h-[25px] text-white" />,
      bgColor: "bg-[#a0522d]",
      shadowClass: "shadow-[0_8px_20px_rgba(160,82,45,0.45)]",
    },
  ];


  return (
    <section id="features" className="py-24 bg-[#f4f5f7] relative overflow-hidden">
      {/* Blue Glow for Features */}
      <div className="absolute top-0 right-0 pointer-events-none z-0">
        <svg width="259" height="302" viewBox="0 0 259 302" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_f_277_884)">
            <rect x="143.947" y="-124.439" width="399.772" height="202.817" rx="101.409" transform="rotate(47.7232 143.947 -124.439)" stroke="#3A76F0" strokeWidth="23.4471"/>
          </g>
          <defs>
            <filter id="filter0_f_277_884" x="0" y="-118.32" width="406.761" height="419.992" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feGaussianBlur stdDeviation="12" result="effect1_foregroundBlur_277_884"/>
            </filter>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16 max-w-2xl">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#f0f5ff] text-[#1a56db] text-sm font-medium mb-6">
            Features
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-black leading-[1.1] tracking-tight mb-4">
            Built for <span className="font-serif italic font-normal text-black">real complexity</span>
          </h2>
          <p className="text-black/60 text-[15px] md:text-[17px] leading-relaxed font-medium">
            Not just a random name picker. PairForm handles the edge cases that break
            every other solution.
          </p>
        </div>
        
        {/* Grid of individual cards with modern styles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 md:p-10 rounded-[2rem] border border-gray-100/80 flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 ${feature.bgColor} ${feature.shadowClass} rounded-xl flex items-center justify-center mb-6 flex-shrink-0`}
              >
                {feature.icon}
              </div>
              <h3 className="font-bold text-black text-lg mb-3">{feature.title}</h3>
              <p className="text-[14px] text-black/60 leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
