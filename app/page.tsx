import Image from "next/image";
import yapbaylogo from "@/public/yapbaylogo.png";
import Container from "@/components/blog/container";
import Script from "next/script";

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
        <p className="mx-auto max-w-2xl md:text-xl lg:text-lg xl:text-xl dark:text-gray-400 mb-6 font-bold">
          Try out the partial MVP on the{" "}
          <a href="/app" target="_blank">
            /app page
          </a>
          !
        </p>
        <h3 className="text-2xl font-semibold tracking-tighter sm:text-3xl mb-6 text-center">
          Join the Waitlist!
        </h3>
        <p className="mx-auto max-w-2xl md:text-xl lg:text-lg xl:text-xl dark:text-gray-400 mb-6">
          Join the YapBay waitlist to receive early access to the remittances
          network we&apos;re building.
        </p>
        <div
          className="w-full max-w-lg mx-auto mb-8 bg-white rounded-lg shadow-md"
          id="getWaitlistContainer"
          data-waitlist_id="17774"
          data-widget_type="WIDGET_1"
        ></div>
        <link
          rel="stylesheet"
          type="text/css"
          href="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.css"
        />
        <Script src="https://prod-waitlist-widget.s3.us-east-2.amazonaws.com/getwaitlist.min.js"></Script>
        <p className="mx-auto max-w-2xl md:text-xl lg:text-lg xl:text-xl dark:text-gray-400 mb-6">
          We also welcome you to our{" "}
          <a
            href="https://chat.whatsapp.com/EIczBVMiMTtCsiknBjtDrK"
            target="_blank"
          >
            WhatsApp group
          </a>{" "}
          for any questions or feedback.
        </p>
      </Container>
    </main>
  );
}
