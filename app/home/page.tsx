import type { Metadata } from "next";
import HomePageClient from "./_components/HomePageClient";

export const metadata: Metadata = {
  title: "Dashboard | PairForm",
  description: "User Dashboard - Manage your events, pairings, and team formations on PairForm.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
