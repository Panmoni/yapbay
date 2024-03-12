import Image from "next/image";
import yapbaylogo from "@/public/yapbaylogo.png";
import Container from "@/components/blog/container";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "YapBay: Empowering Global Remittances with Web3",
  description:
    "Unlock faster, cheaper, and direct cross-border payments leveraging the power of cryptocurrency. Discover the future of remittances with YapBay.",
};

export default function Home() {
  return (
    <main>
      <Container>
        <Image
          src={yapbaylogo}
          height={300}
          width={300}
          alt="YapBay logo"
          className="mx-auto mb-8"
        />
        <h2 className="text-4xl font-bold tracking-tighter sm:text-6xl mb-6 text-center">
          Welcome to Yap Bay
        </h2>
        <h3 className="text-2xl font-semibold tracking-tighter sm:text-3xl mb-6 text-center">
          Empowering global remittances with Web3
        </h3>
        <p className="mx-auto max-w-2xl md:text-xl lg:text-lg xl:text-xl dark:text-gray-400 mb-6">
          YapBay is a Web3 remittance platform that combines TradFi and DeFi to
          enable faster, cheaper, and more accessible cross-border payments for
          the world&apos;s unbanked and underbanked population.
        </p>
        <p className="mx-auto max-w-2xl md:text-xl lg:text-lg xl:text-xl dark:text-gray-400 mb-6">
          During February and March 2024, YapBay is building with{" "}
          <a href="https://backdropbuild.com/builds/v3/yb-xnu" target="_blank">
            BackdropBuild
          </a>
          !
        </p>
      </Container>
    </main>
  );
}
