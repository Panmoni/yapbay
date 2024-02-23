import type { Metadata } from "next";

import "./globals.css";

import GlobalHeader from "@/components/ui/GlobalHeader";
import GlobalFooter from "@/components/ui/GlobalFooter";

import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yap Bay: Uncensorable P2P Remittances",
  description:
    "YapBay is an uncensorable P2P remittance marketplace that supports both fiat currency and cryptocurrency. Currently in development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen">
          <GlobalHeader />
          {children}
          <GlobalFooter />
        </div>
      </body>
    </html>
  );
}
