import type { Metadata } from "next";
import PublicResultPageClient from "./PublicResultPageClient";

export const metadata: Metadata = {
  title: "Event Results | PairForm",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PublicResultPage() {
  return <PublicResultPageClient />;
}
