import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Yap Bay: Uncensorable P2P Remittances",
  description: "YapBay is an uncensorable P2P remittance marketplace that supports both fiat currency and cryptocurrency. Currently in development.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col items-center justify-center min-h-screen bg-gray-100`}>{children}</body>
    </html>
  );
}
