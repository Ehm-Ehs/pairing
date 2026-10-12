import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { PRIVACY_POLICY } from "@/content/legal/privacy";

export const metadata: Metadata = {
  title: "Privacy Policy | PairForm",
  description: "What personal information PairForm collects, why, who sees it, how long it is kept and your choices.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <LegalDocument content={PRIVACY_POLICY} />;
}
