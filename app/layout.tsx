import type { Metadata, Viewport } from "next";
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

const newTitle = "PairForm - Smart automated balancing. Group generator. Zero chaos.";
const description = "Create balanced groups, organize Secret Santa events, and manage team pairings instantly. No spreadsheets, just seamless automation.";

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://pair-form.com"),
  title: newTitle,
  description: description,
  applicationName: "PairForm",
  keywords: ["group generator", "random pair", "secret santa", "team builder", "randomizer"],
  authors: [{ name: "PairForm Team" }],
  creator: "PairForm",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PairForm",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: newTitle,
    description: description,
    url: "https://pair-form.com",
    siteName: "PairForm",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: newTitle,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: newTitle,
    description: description,
    images: ["/opengraph-image.png"],
    creator: "@pairform",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PairForm",
    "url": "https://pair-form.com",
    "logo": "https://pair-form.com/icon.png"
  };

  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "PairForm",
    "url": "https://pair-form.com"
  };

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "PairForm",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "url": "https://pair-form.com",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Smart group generator and team balancing platform for Secret Santa games, corporate workshops, classrooms, breakout rooms, speed networking, and hackathons.",
    "featureList": [
      "Random Team Generator",
      "Balanced Team Generator with Role Caps",
      "Secret Santa Generator & Wishlists",
      "Classroom Group Maker for Teachers",
      "Breakout Room Generator for Workshops",
      "Speed Networking & 1-on-1 Pair Generator"
    ]
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
        />
      </head>
      <body className={`${outfit.variable} ${playfair.variable} ${sora.variable} font-outfit antialiased bg-gray-50 text-gray-900`}>
        <Clarity />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
