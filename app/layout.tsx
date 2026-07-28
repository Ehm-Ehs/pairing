import type { Metadata } from "next";
import "./globals.css";
import Clarity from "../src/components/Clarity";
import { Providers } from "./providers";
import { Outfit, Playfair_Display, Sora } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["italic", "normal"],
});
const sora = Sora({ subsets: ["latin"], variable: "--font-sora" });

export const metadata: Metadata = {
  metadataBase: new URL("https://pair-form.com"),
  title: "PairForm - Random Group & Pair Generator",
  description:
    "Instantly create fair, balanced groups and pairs for teams, classes, or events. No more spreadsheets, just seamless automation.",
  applicationName: "PairForm",
  keywords: ["group generator", "random pair", "secret santa", "team builder", "randomizer"],
  authors: [{ name: "PairForm Team" }],
  creator: "PairForm",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PairForm - Random Group & Pair Generator",
    description:
      "Instantly create fair, balanced groups and pairs for teams, classes, or events. No more spreadsheets, just seamless automation.",
    url: "https://pair-form.com",
    siteName: "PairForm",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PairForm - Random Group & Pair Generator",
    description:
      "Instantly create fair, balanced groups and pairs for teams, classes, or events.",
    creator: "@pairform",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${outfit.variable} ${playfair.variable} ${sora.variable} antialiased font-sans`}
      >
        <Providers>
          <Clarity />
          {children}
        </Providers>
      </body>
    </html>
  );
}
