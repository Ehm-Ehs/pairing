import type { Metadata } from "next";
import JoinRandomPositioningClient from "./JoinRandomPositioningClient";

export const metadata: Metadata = {
  title: "Join Event | PairForm",
  robots: {
    index: false,
    follow: false,
  },
};

export default function JoinRandomEventPage() {
  return <JoinRandomPositioningClient />;
}
