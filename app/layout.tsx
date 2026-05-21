import type { Metadata } from "next";
import "./globals.css";
import Clarity from "../src/components/Clarity";
import { Providers } from "./providers";
import { Inter, Space_Grotesk, Playfair_Display } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  style: ["italic", "normal"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pair-form.com"),
  title: "PairForm - Smart automated balancing. Fair groups. Zero chaos.",
  description:
    "Create balanced groups, organize Secret Santa events, and manage team pairings instantly. No spreadsheets, just seamless automation.",
  openGraph: {
    title: "PairForm - Smart automated balancing. Fair groups. Zero chaos.",
    description:
      "Create balanced groups, organize Secret Santa events, and manage team pairings instantly. No spreadsheets, just seamless automation.",
    url: "https://pair-form.com",
    siteName: "PairForm",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "PairForm Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PairForm - Smart automated balancing. Fair groups. Zero chaos.",
    description:
      "Create balanced groups, organize Secret Santa events, and manage team pairings instantly.",
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${playfair.variable} antialiased font-sans`}
      >
        <Providers>
          <Clarity />
          {children}
        </Providers>
      </body>
    </html>
  );
}
