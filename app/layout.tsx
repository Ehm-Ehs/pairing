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
  title: "PairForm - Smart automated balancing. Fair groups. Zero chaos.",
  description:
    "Create balanced groups, organize Secret Santa events, and manage team pairings instantly. No spreadsheets, just seamless automation.",
  applicationName: "PairForm",
  keywords: ["group generator", "random pair", "secret santa", "team builder", "randomizer"],
  authors: [{ name: "PairForm Team" }],
  creator: "PairForm",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PairForm - Smart automated balancing. Fair groups. Zero chaos.",
    description:
      "Create balanced groups, organize Secret Santa events, and manage team pairings instantly. No spreadsheets, just seamless automation.",
    url: "https://pair-form.com",
    siteName: "PairForm",
    images: [
      {
        url: "https://pair-form.com/opengraph-image.jpg",
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "PairForm - Smart automated balancing. Fair groups. Zero chaos.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PairForm - Smart automated balancing. Fair groups. Zero chaos.",
    description:
      "Create balanced groups, organize Secret Santa events, and manage team pairings instantly. No spreadsheets, just seamless automation.",
    images: ["https://pair-form.com/opengraph-image.jpg"],
    creator: "@pairform",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
        <meta property="og:title" content="PairForm - Smart automated balancing. Fair groups. Zero chaos." />
        <meta property="og:description" content="Create balanced groups, organize Secret Santa events, and manage team pairings instantly. No spreadsheets, just seamless automation." />
        <meta property="og:image" content="https://pair-form.com/opengraph-image.jpg" />
        <meta property="og:image:secure_url" content="https://pair-form.com/opengraph-image.jpg" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:url" content="https://pair-form.com" />
        <meta property="og:site_name" content="PairForm" />
        <meta property="og:type" content="website" />
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
