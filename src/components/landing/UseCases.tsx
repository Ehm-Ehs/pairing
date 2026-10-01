"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DiagonalArrowIcon, ChevronRightIcon } from "../ui/icons";
import { FaCheck, FaChevronDown } from "react-icons/fa6";

export interface FaqItem {
  question: string;
  answer: string;
}

function FaqAccordion({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle: string;
  items: FaqItem[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleItem = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 text-sm md:text-base">{subtitle}</p>
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition-all duration-200 shadow-xs"
            >
              <button
                type="button"
                onClick={() => toggleItem(idx)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none group"
                aria-expanded={isOpen}
              >
                <span className="font-semibold text-gray-900 text-base md:text-lg group-hover:text-[#0B51D8] transition-colors pr-4">
                  {item.question}
                </span>
                <div
                  className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? "rotate-180 bg-blue-50 text-[#0B51D8]" : ""
                  }`}
                >
                  <FaChevronDown className="w-3.5 h-3.5" />
                </div>
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-slate-600 text-sm md:text-base leading-relaxed border-t border-slate-100 animate-in fade-in-50 duration-200">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface UseCaseItem {
  id: string;
  title: string;
  shortDesc: string;
  gradient: string;
  border: string;
  hoverShadow: string;
  initialColSpan: string;
  actionCards: { label: string; href: string; badge: string; desc: string }[];
  featuresList: string[];
}

const useCasesData: UseCaseItem[] = [
  {
    id: "hackathons",
    title: "Hackathons & Competitions",
    shortDesc: "Form balanced teams with the right skill mix. Enforce role caps so every team has developers, designers, and product people. Handle last-minute additions without reshuffling everything.",
    gradient: "from-white to-[#DCE8FF]",
    border: "border-[#C9DBFF]",
    hoverShadow: "hover:shadow-[0_12px_40px_rgba(37,99,235,0.08)]",
    initialColSpan: "md:col-span-5",
    actionCards: [
      {
        label: "Create Role-Balanced Teams",
        href: "/create-event?type=role-based",
        badge: "Role Caps",
        desc: "Set max limits for Developers, UI/UX Designers, and PMs per team.",
      },
      {
        label: "Create Skill-Balanced Groups",
        href: "/create-event?type=role-based",
        badge: "Skill Match",
        desc: "Equalize senior vs junior experience levels across competing teams.",
      },
    ],
    featuresList: [
      "Enforce developer, designer, and PM ratios per team",
      "Equalize experience levels (Senior vs Junior members)",
      "Instant last-minute additions without reshuffling existing teams",
    ],
  },
  {
    id: "educational",
    title: "Educational Settings",
    shortDesc: "Create project groups for courses and workshops. Ensure every team has the diversity of skills your curriculum requires. Works for classes of 10 or 200.",
    gradient: "from-white to-[#D5F5DC]",
    border: "border-[#C2EFC7]",
    hoverShadow: "hover:shadow-[0_12px_40px_rgba(34,197,94,0.08)]",
    initialColSpan: "md:col-span-7",
    actionCards: [
      {
        label: "Create Student Project Groups",
        href: "/create-event?type=role-based",
        badge: "Classroom",
        desc: "Differentiate reading and skill levels across student work groups.",
      },
      {
        label: "Create Lab Partners & Pairs",
        href: "/create-event?type=random-positioning",
        badge: "1-on-1",
        desc: "Pair students up 1-on-1 for science labs, peer editing, and study buddies.",
      },
    ],
    featuresList: [
      "Separate specific students (behavior or talkative pairs)",
      "Balance academic abilities and reading levels across groups",
      "Transparent, unbiased grouping projected on whiteboard",
    ],
  },
  {
    id: "workshops",
    title: "Corporate Workshops",
    shortDesc: "Form cross-functional teams for training sessions, strategy workshops, and team-building activities. Automatic role balancing across departments.",
    gradient: "from-white to-[#FFE0D8]",
    border: "border-[#FFD0C2]",
    hoverShadow: "hover:shadow-[0_12px_40px_rgba(249,115,22,0.08)]",
    initialColSpan: "md:col-span-7",
    actionCards: [
      {
        label: "Create Workshop Breakout Rooms",
        href: "/create-event?type=random-positioning",
        badge: "Zoom & Teams",
        desc: "Ensure 1 facilitator per room with cross-departmental mix.",
      },
      {
        label: "Create Speed Networking Rotations",
        href: "/create-event?type=random-positioning",
        badge: "Multi-Round",
        desc: "Generate 1-on-1 networking rounds with zero duplicate pairings.",
      },
    ],
    featuresList: [
      "Ensure 1 facilitator or leader per breakout room/table",
      "Cross-pollinate departments (Sales, Tech, Product, Marketing)",
      "Export CSV formatted for Zoom and Teams breakout rooms",
    ],
  },
  {
    id: "gifting",
    title: "Secret Santa & Gifting",
    shortDesc: "Replace the hat-draw chaos. Everyone registers, the organizer generates pairs in one click, and matches are revealed privately. Simple, fair, fun.",
    gradient: "from-white to-[#F1D5FF]",
    border: "border-[#EECEFF]",
    hoverShadow: "hover:shadow-[0_12px_40px_rgba(168,85,247,0.08)]",
    initialColSpan: "md:col-span-5",
    actionCards: [
      {
        label: "Create Secret Santa Exchange",
        href: "/create-event?type=secret-santa",
        badge: "Secret Draw",
        desc: "Draw names with 100% secrecy, exclusion rules, and wishlists.",
      },
      {
        label: "Create Holiday Gift Exchange",
        href: "/create-event?type=secret-santa",
        badge: "Gift Swap",
        desc: "Instant WhatsApp & Email secret partner notifications.",
      },
    ],
    featuresList: [
      "100% secret drawing even for the event organizer",
      "Spouse, partner, and family exclusion rules",
      "Instant WhatsApp & Email secret match notifications with wishlists",
    ],
  },
];

const homeFaqItems: FaqItem[] = [
  {
    question: "How does PairForm create balanced teams automatically?",
    answer: "Unlike simple randomizers that only shuffle names by chance, PairForm allows you to set custom role caps, skill ratings, or demographic constraints. Our algorithm evaluates millions of combinations to distribute these attributes evenly across all groups.",
  },
  {
    question: "Can I organize Secret Santa with custom exclusion rules?",
    answer: "Yes! PairForm supports spouse and partner exclusion rules so specific participants cannot draw each other. Secret assignments and wishlists are delivered privately via WhatsApp or Email.",
  },
  {
    question: "Do participants need to create an account to view their assigned group?",
    answer: "No. Participants access their assigned group, Secret Santa partner, or breakout room schedule via unique secure links without needing to register or download an app.",
  },
  {
    question: "How are team assignments sent to participants?",
    answer: "Once your event is generated, you can send automated WhatsApp or Email notifications directly to participants or share a secure web link.",
  },
  {
    question: "Is PairForm free for teachers and small event hosts?",
    answer: "Yes! PairForm provides free initial credits and free online generators for classrooms, workshops, and gift swaps.",
  },
  {
    question: "Can I pre-assign breakout rooms for Zoom or Microsoft Teams workshops?",
    answer: "Yes. PairForm generates clean pre-assigned CSV exports formatted for direct upload into Zoom breakout rooms and Microsoft Teams meetings.",
  },
];

export default function UseCases() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="use-cases" className="py-24 bg-white relative overflow-hidden">
      {/* Background container for the green glow SVG */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="relative mx-auto h-full px-4 sm:px-6 lg:px-8">
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
        {/* Section Header */}
        <div className="mb-12">
          <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#EBF1FF] text-[#0B51D8] text-xs font-semibold mb-6 tracking-wide shadow-sm">
            Use cases
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold text-gray-900 leading-[1.15] tracking-tight mb-4">
            Works for <span className="font-serif italic font-normal text-gray-800">any setting</span>
          </h2>
          <p className="text-gray-500 text-[15px] md:text-[16px] leading-relaxed max-w-2xl font-medium">
            Whether you're running a hackathon or a classroom exercise, PairForm handles the logistics so you can focus on the event. Click the arrow button to view event creation options.
          </p>
        </div>

        {/* Use Cases Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start transition-all duration-500 ease-in-out">
          {useCasesData.map((item) => {
            const isExpanded = expandedId === item.id;
            const isAnotherExpanded = expandedId !== null && expandedId !== item.id;

            // When expanded, the opened card takes full width (md:col-span-12).
            // Non-expanded cards retain their exact initial colSpans (5 or 7) or expand to col-span-12 when alone in a row.
            let colSpanClass = item.initialColSpan;
            if (isExpanded) {
              colSpanClass = "md:col-span-12 ring-2 ring-[#0B51D8] shadow-lg";
            } else if (isAnotherExpanded) {
              // Row 1 pair (hackathons=5, educational=7) total 12 together!
              // Row 2 pair (workshops=7, gifting=5) total 12 together!
              colSpanClass = item.initialColSpan;
            }

            return (
              <div
                key={item.id}
                className={`group relative bg-gradient-to-br ${item.gradient} border ${item.border} rounded-[1.5rem] p-8 flex flex-col justify-between shadow-sm ${item.hoverShadow} transition-all duration-500 ease-in-out ${colSpanClass} min-h-[220px]`}
              >
                <div className="flex justify-between items-start gap-4">
                  <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed font-medium max-w-[82%]">
                    {item.shortDesc}
                  </p>
                  <div
                    onClick={() => toggleExpand(item.id)}
                    aria-label={`Toggle setup details for ${item.title}`}
                    className="w-10 h-10 rounded-full bg-[#0B51D8] flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-all duration-300 cursor-pointer focus:outline-none"
                  >
                    <DiagonalArrowIcon
                      className={`w-4 h-4 text-white transition-transform duration-300 ${isExpanded ? "rotate-180" : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        }`}
                    />
                  </div>
                </div>

                <div className="mt-8 sm:mt-12">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {item.title}
                  </h3>
                </div>

                {/* Inline Expanded Content Space */}
                {isExpanded && (
                  <div className="mt-8 pt-8 border-t border-slate-200/80 animate-in fade-in zoom-in-95 duration-300 space-y-6">
                    <div className="bg-white/95 backdrop-blur-xs rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
                      {/* Feature Bullet Points */}
                      <ul className="space-y-2.5 mb-8">
                        {item.featuresList.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-blue-50 text-[#0B51D8] flex items-center justify-center flex-shrink-0">
                              <FaCheck size={10} />
                            </span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Direct Event Creation Cards (Links directly to /create-event?type=...) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {item.actionCards.map((ac, idx) => (
                          <Link
                            key={idx}
                            href={ac.href}
                            className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-blue-50/60 to-indigo-50/40 border border-blue-100 hover:border-[#0B51D8] hover:shadow-md transition-all group/card"
                          >
                            <div className="pr-3">
                              <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0B51D8] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                                {ac.badge}
                              </span>
                              <h4 className="text-base font-bold text-slate-900 group-hover/card:text-[#0B51D8] transition-colors mb-1">
                                {ac.label}
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                                {ac.desc}
                              </p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-[#0B51D8] text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover/card:scale-105 transition-transform">
                              <ChevronRightIcon className="w-2.5 h-4 text-white" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Integrated FAQ Section directly under "Works for any setting" headers */}
        <div className="mt-20">
          <FaqAccordion
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about team formation, pairing algorithms, and PairForm."
            items={homeFaqItems}
          />
        </div>
      </div>
    </section>
  );
}
