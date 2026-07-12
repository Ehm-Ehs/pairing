"use client";

import Logo from "../../assets/logo";

interface FooterProps {
  scrollToHowItWorks: () => void;
  scrollToUseCases: () => void;
  scrollToFeatures: () => void;
}

interface FooterLink {
  label: string;
  href: string;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

interface FooterColumnProps {
  title: string;
  links: FooterLink[];
  ulClassName?: string;
}

const FooterColumn = ({ title, links, ulClassName = "" }: FooterColumnProps) => {
  return (
    <div className="md:col-span-3 text-center md:text-left">
      <h3 className="text-white font-bold mb-6 text-lg">{title}</h3>
      <ul className={`space-y-4 text-[15px] text-blue-50 font-medium ${ulClassName}`}>
        {links.map((link, index) => (
          <li key={index}>
            <a
              href={link.href}
              onClick={link.onClick}
              className="hover:text-white text-gray-600 transition-colors cursor-pointer block"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function Footer({
  scrollToHowItWorks,
  scrollToUseCases,
  scrollToFeatures,
}: FooterProps) {
  const productLinks: FooterLink[] = [
    {
      label: "How it works",
      href: "#how-it-works",
      onClick: (e) => {
        e.preventDefault();
        scrollToHowItWorks();
      },
    },
    {
      label: "Features",
      href: "#features",
      onClick: (e) => {
        e.preventDefault();
        scrollToFeatures();
      },
    },
    {
      label: "Uses cases",
      href: "#use-cases",
      onClick: (e) => {
        e.preventDefault();
        scrollToUseCases();
      },
    },
  ];

  const useCaseLinks: FooterLink[] = [
    {
      label: "Secret Santa",
      href: "#use-cases",
      onClick: (e) => {
        e.preventDefault();
        scrollToUseCases();
      },
    },
    {
      label: "Team workshops",
      href: "#use-cases",
      onClick: (e) => {
        e.preventDefault();
        scrollToUseCases();
      },
    },
    {
      label: "Group formation",
      href: "#use-cases",
      onClick: (e) => {
        e.preventDefault();
        scrollToUseCases();
      },
    },
  ];

  return (
    <footer className="bg-[#2563eb] pt-20 pb-10 border-t border-[#1d4ed8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          {/* Left Col */}
          <div className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center mb-6">
              <Logo className="h-9 w-auto" variant="white" />
            </div>
            <p className="text-blue-50 text-[15px] max-w-sm leading-relaxed font-medium">
              Smart group formation for workshops, hackathons, Secret Santa, and everything in between.
            </p>
          </div>

          {/* Middle Col */}
          <FooterColumn title="Product" links={productLinks} ulClassName="animate-none" />

          {/* Right Col */}
          <FooterColumn title="Use Cases" links={useCaseLinks} />

        </div>

        <div className="border-t border-[#3b82f6] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-sm text-blue-100">
            © 2026 PairForm. No spreadsheets. No manual pairing. Just balanced groups.
          </p>
          <p className="text-sm text-blue-100">
            Built for real events.
          </p>
        </div>
      </div>
    </footer>
  );
}
