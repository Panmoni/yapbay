import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import Link from "next/link";
import Image from "next/image";

import deckSlide from "@/public/slide2.png";

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
          <h3 className="text-2xl font-bold mb-2 mt-8">
            Fiat-in, fiat-out remittances via P2P crypto trades
          </h3>
          <p className="my-4">
            YapBay is a Web3 P2P remittance platform that enables remittance
            senders to chain together fiat and crypto transactions, bypassing
            TradFi limits.
          </p>
          <p className="my-4">
            Censorship-resistant and KYC-free, YapBay fosters financial
            inclusion for the world&apos;s 2 billion unbanked and underbanked.
            With a user-friendly, transparent, and community-governed approach,
            YapBay empowers individuals to participate in the global economy on
            their own terms serving as a gateway to unlocking trillions in
            pent-up capital.
          </p>
          <h3 className="text-2xl font-bold mb-2 mt-8">Problem</h3>
          <p className="my-4">
            Sub-$200 remittances frequently incur high fixed fees compared to
            the modest sums sent. This makes them expensive for certain
            remittance corridors that terminate in Africa, SE Asia, and Latin
            America.
          </p>
          <p className="my-4">
            These steep costs hinder individuals from supporting their families,
            impede their participation in the global economy and frustrate
            capital formation in their home countries.
          </p>
          <p className="my-4">
            The World Bank reports that the average cost of sending $200 remains
            high at 6.2% in 2023, far from the 3% target set for 2030.
          </p>
          <h3 className="text-2xl font-bold mb-2 mt-8">Solution</h3>
          <p className="my-4">
            YapBay is a LocalBitcoins where remittance senders chain together 2
            peer-to-peer trade offers into 1 fiat-in, fiat-out remittance
            transaction. Behind the scenes, P2P traders use stablecoins as a
            fast, hassle-free and low-cost transport layer. Remittance senders
            and receivers use their preferred fiat currencies and avoid any need
            for immediate onboarding, technical knowledge or exposure to
            volatility.
          </p>
          <p className="my-4">
            Remittance senders can also buy basic necessities, such as groceries
            and medicines, from merchants that are local to their remittance
            recipients. Often, merchants can deliver these products to the
            recipients&apos; homes. We call these “combo remittances”.
          </p>

          <h3 className="text-2xl font-bold mb-2 mt-8">Unique Value</h3>
          <p className="my-4">
            YapBay has a few characteristics that set it apart, including the
            following:
          </p>

          <ul className="list-disc pl-10">
            <li>combo remittances.</li>
            <li>the focus on sub-$200 remittances.</li>
            <li>
              the acceptance of users who lack sufficient formal identification.
            </li>
            <li>4 years of fieldwork in the developing world.</li>
            <li>no protocol-level KYC/AML.</li>
            <li>a strong network of local experts in the developing world.</li>
            <li>
              the perspective of the developing world as a business opportunity,
              and not a charitable endeavor.
            </li>
          </ul>
          <h3 className="text-2xl font-bold mb-2 mt-8">Impact</h3>
          <p className="my-4">
            YapBay has the potential to significantly reduce the cost of
            remittances for millions of people in developing countries, enabling
            them to send and receive more money to support their families and
            communities. By driving the adoption of cryptocurrency as a medium
            of exchange, the project also contributes to the broader goal of
            financial inclusion and economic empowerment.
          </p>
          <p className="my-4">
            YapBay addresses the clear need for more accessible, affordable, and
            efficient remittance services in the global financial ecosystem. By
            leveraging open-source technologies and decentralized
            infrastructure, YapBay aims to fill the gap in serving the
            world&apos;s unbanked and underbanked population, who are currently
            underserved by traditional remittance providers due to high fees,
            limited access, and slow transactions.
          </p>

          <p className="my-4">
            YapBay&apos;s impact can extend beyond the direct remittance market.
            By driving the adoption of cryptocurrency as a medium of exchange
            and empowering individuals to participate in the global economy on
            their own terms, YapBay can help unlock trillions of dollars in
            pent-up capital and stimulate economic growth in underserved
            regions. As the platform gains traction and establishes a strong
            network effect, it has the potential to become a leading player in
            the global remittance market and a catalyst for financial inclusion
            and economic empowerment.
          </p>
          <h3 className="text-2xl font-bold mb-2 mt-8">Progress</h3>
          <p className="my-4">
            YapBay is at a pre-seed stage and the development of an MVP is in
            progress.
          </p>
          <p className="my-4">
            From 2018 to 2021, I and my teams performed extensive fieldwork in
            Latin America educating new crypto users and learning what they
            want. We did a remittances pilot between Madrid and Caracas in 2019,
            which was quite popular among Venezuelans in Spain.
          </p>
          <p className="my-4">
            The project benefits from the contact information of about 10,000
            people onboarded to crypto during our fieldwork.
          </p>
          <h3 className="text-2xl font-bold mb-2 mt-8">Deck</h3>
          <p className="my-4">
            <Link
              target="_blank"
              href="https://static.panmoni.org/yb/yapbay-deck.pdf"
            >
              Download the current YapBay deck.
              <Image
                src={deckSlide}
                height={1280}
                width={720}
                alt="Deck slide"
                className="mx-auto mb-8 mt-2"
              />
            </Link>
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
            <Link target="_blank" href="https://georgedonnelly.com/portfolio/">
              George Donnelly
            </Link>
            , who has been working on crypto mass adoption since 2018. Visit
            <Link target="_blank" href="https://georgedonnelly.com/portfolio/">
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

          <h2 className="text-3xl font-bold mb-2 mt-8">Acknowledgments</h2>

          <ul className="list-disc pl-10">
            <li>
              <a
                href="https://www.gitcoin.co/blog/announcing-gg20"
                target="_blank"
              >
                Gitcoin Grants 20 (GG20)
              </a>
            </li>
            <li>Keon Kim (mentoring)</li>
            <li>Adam Killam (mentoring)</li>
            <li>Kain Warwick (mentoring)</li>
            <li>Mike Komaransky (mentoring)</li>
            <li>Simon Chamorro (mentoring)</li>
            <li>
              <Link
                href="https://backdropbuild.com/builds/v3/yb-xnu"
                target="_blank"
              >
                Backdrop Build Hackathon v3
              </Link>
            </li>
            <li>Jose Araujo (team member)</li>
            <li>Gabriel Mitacchione (team member)</li>
            <li>
              The people of the developing world who have taught us so much.
            </li>
            <li>
              The BCH community, most notably Mike Komaransky & Georg Engelmann.
            </li>
            <li>The Dash DAO.</li>
          </ul>
        </div>
      </Container>
    </main>
  );
}
