import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { TERMS_OF_SERVICE } from "@/content/legal/terms";

export const metadata: Metadata = {
  title: "Terms of Service | PairForm",
  description: "The rules for using PairForm: accounts, organizations, tokens, payments, refunds and acceptable use.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <LegalDocument content={TERMS_OF_SERVICE} />;
}
