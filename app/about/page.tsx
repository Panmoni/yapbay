import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import Link from "next/link";

import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "About YapBay",
  description:
    "YapBay is a revolutionary peer-to-peer remittance platform that leverages the power of cryptocurrency to enable faster, cheaper, and more accessible cross-border payments.",
};

export default function Roadmap() {
  return (
    <main>
      <Container>
        <PageTitle title="About" />
        <div className="max-w-2xl mx-auto mb-10">
          <p className="my-4">
            YapBay is a revolutionary peer-to-peer remittance platform that
            leverages the power of cryptocurrency to enable faster, cheaper, and
            more accessible cross-border payments for the world&apos;s 2 billion
            unbanked and underbanked individuals.
          </p>

          <p className="my-4">
            By combining traditional finance (TradFi) payment networks with
            decentralized finance (DeFi) infrastructure, YapBay creates a
            censorship-resistant, KYC-free marketplace where users can chain
            together fiat and crypto transactions to route around capital
            controls and other limitations of legacy remittance services.
          </p>
          <p className="my-4">
            With YapBay, users can send and receive remittances using their
            preferred fiat currencies while benefiting from the speed, security,
            and low fees of cryptocurrency as a transport layer.
          </p>

          <p className="my-4">
            As a Web3-native platform, YapBay aims to disrupt the $700 billion
            remittance industry, fostering financial inclusion and economic
            opportunity for millions of people in developing nations, and paving
            the way for widespread adoption of cryptocurrency as a medium of
            exchange.
          </p>

          <p className="my-4">
            By offering a user-friendly, transparent, and community-governed
            alternative to traditional remittance providers, YapBay is poised to
            become a leading player in the global payment landscape, unlocking
            trillions of dollars in pent-up capital and empowering individuals
            to participate in the global economy on their own terms.
          </p>

          <h2 className="text-3xl font-bold mb-2 mt-8">Mission</h2>

          <p className="my-4">
            Our mission is to facilitate access to cryptocurrency for people
            across the globe, without the need for onerous KYC procedures or the
            arbitrary limits and opaque reserve status of centralized exchanges.
          </p>

          <p className="my-4">
            We are building a peer-to-peer crypto exchange that provides anyone,
            anywhere with uncensorable, KYC-free, transparent, and open-source
            fiat on-ramps and off-ramps. By doing so, we aim to contribute
            meaningfully towards the goal of enabling access to prosperity for
            people worldwide who have been denied the full benefits of an
            accountable monetary system.
          </p>

          <h2 className="text-3xl font-bold mb-2 mt-8">Vision</h2>
          <p className="my-4">
            We envision a world of universal prosperity, where every human being
            has the opportunity to realize their potential. A world where
            everyone, everywhere, enjoys monetary freedom and can use and create
            money as they see fit, trading it on a voluntary basis across
            borders, from anywhere to anywhere, and from anyone to anyone. We
            strive for a world of crypto mass adoption, where everyone has
            access to prosperity, and no one is cut out of the system or left
            behind.
          </p>

          <h2 className="text-3xl font-bold mb-2 mt-8">Team</h2>
          <p className="my-4">
            Currently the team is{" "}
            <Link href="https://georgedonnelly.com/portfolio/">
              George Donnelly
            </Link>
            , who has been working on crypto mass adoption since 2018. Visit
            <Link href="https://georgedonnelly.com/portfolio/">
              {" "}
              GeorgeDonnelly.com
            </Link>{" "}
            for more information.
          </p>

          <h2 className="text-3xl font-bold mb-2 mt-8">Join Us</h2>

          <p className="my-4">
            By executing on our <Link href="/roadmap">roadmap</Link>, We aim to
            create a robust, user-friendly, and inclusive platform that empowers
            individuals worldwide to participate in the global economy and
            benefit from the transformative potential of cryptocurrency.
          </p>
          <p className="my-4">
            We invite you to join us on this journey towards a more equitable
            and prosperous future.
          </p>
        </div>
      </Container>
    </main>
  );
}
