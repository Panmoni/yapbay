// @/app/app/layout.tsx

"use client";

import { Providers } from "@/lib/rainbowkit";
import ConnectButton from "@/components/contracts/connectButton";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex items-center mx-auto justify-center mt-[-1.5rem] mb-4">
        <ConnectButton />
      </div>
      {children}
    </Providers>
  );
}
