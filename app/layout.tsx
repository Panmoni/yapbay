// @/app/layout.tsx

import type { Metadata } from "next";

import "./globals.css";

import GlobalHeader from "@/components/ui/GlobalHeader";
import GlobalFooter from "@/components/ui/GlobalFooter";

import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | YapBay",
    default: "YapBay: Empowering Global Remittances with Web3",
  },
  description:
    "YapBay is a Web3 remittance platform combining TradFi and DeFi to enable faster, cheaper, and more accessible cross-border payments for the world's unbanked and underbanked population.",
  metadataBase: new URL("https://yapbay.com"),
  // og: {
  //   image: new URL("/images/og-image.jpg", import.meta.url).href,
  //   type: "website",
  //   locale: "en_US",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#000000"
        />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
        <script
          src="https://beamanalytics.b-cdn.net/beam.min.js"
          data-token="c989accf-6494-49a8-ad3a-ee34c91aeedd"
          async
        ></script>
      </head>
      <body className={inter.className}>
        <div className="min-h-screen text-lg">
          <GlobalHeader />
          {children}
          <GlobalFooter />
        </div>
      </body>
    </html>
  );
}
