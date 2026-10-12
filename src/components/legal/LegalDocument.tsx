import React from "react";
import Link from "next/link";
import Logo from "@/assets/logo";
import { COMPANY, LEGAL_EFFECTIVE_DATE, type LegalBlock, type LegalDocumentContent } from "@/content/legal";

/** Renders text, turning **double-starred** parts into bold. */
const RichText = ({ text }: { text: string }) => (
  <>
    {text.split("**").map((part, index) =>
      index % 2 === 1 ? (
        <strong key={index} className="font-semibold text-slate-900">
          {part}
        </strong>
      ) : (
        <React.Fragment key={index}>{part}</React.Fragment>
      )
    )}
  </>
);

const Block = ({ block }: { block: LegalBlock }) => {
  if (typeof block === "string") {
    return (
      <p className="text-slate-600 leading-relaxed">
        <RichText text={block} />
      </p>
    );
  }
  if ("label" in block) {
    return <h3 className="text-base font-bold text-slate-900 pt-2">{block.label}</h3>;
  }
  return (
    <ul className="list-disc pl-5 space-y-2 text-slate-600 leading-relaxed marker:text-blue-500">
      {block.list.map((item) => (
        <li key={item}>
          <RichText text={item} />
        </li>
      ))}
    </ul>
  );
};

/** The page layout shared by the Privacy Policy and the Terms of Service. */
export const LegalDocument = ({ content }: { content: LegalDocumentContent }) => (
  <div className="min-h-screen bg-gradient-to-b from-[#99bbff]/30 via-[#e6efff]/40 to-white text-slate-900 font-sans px-4 sm:px-8">
    <header className="max-w-3xl mx-auto w-full flex items-center justify-between py-6">
      <Link href="/" aria-label="PairForm Home">
        <Logo className="h-9 w-auto" />
      </Link>
      <Link href="/" className="text-sm font-semibold text-[#1d4ed8] hover:underline">
        Back to home
      </Link>
    </header>

    <main className="max-w-3xl mx-auto w-full bg-white border border-blue-100 rounded-[2rem] p-6 sm:p-12 shadow-xl text-left">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{content.title}</h1>
      <p className="text-sm text-slate-500 mt-2 mb-8">Effective date: {LEGAL_EFFECTIVE_DATE}</p>
      {content.intro && <p className="text-slate-600 leading-relaxed mb-8">{content.intro}</p>}

      <div className="space-y-10">
        {content.sections.map((section) => (
          <section key={section.title} className="space-y-4">
            <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
            {section.blocks.map((block, index) => (
              <Block key={index} block={block} />
            ))}
          </section>
        ))}
      </div>
    </main>

    <footer className="max-w-3xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2 py-8 text-xs text-slate-500">
      <span>
        © {new Date().getFullYear()} {COMPANY.name}. PairForm.
      </span>
      <LegalLinks className="hover:text-slate-700 hover:underline" />
    </footer>
  </div>
);

/** Links to both legal pages, for footers. */
export const LegalLinks = ({ className = "" }: { className?: string }) => (
  <span className="flex items-center gap-4">
    <Link href="/privacy" className={className}>
      Privacy Policy
    </Link>
    <Link href="/terms" className={className}>
      Terms of Service
    </Link>
  </span>
);
