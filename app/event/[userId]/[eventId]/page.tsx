import type { Metadata } from "next";
import JoinSecretSantaClient from "./JoinSecretSantaClient";

export const metadata: Metadata = {
  title: "Join Event | PairForm",
  robots: {
    index: false,
    follow: false,
  },
};

export default function JoinEventPage() {
  return <JoinSecretSantaClient />;
}
