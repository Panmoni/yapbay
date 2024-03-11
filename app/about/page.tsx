import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";
import Link from "next/link";

export default function Roadmap() {
  return (
    <main>
      <Container>
        <PageTitle title="About" />
        <div className="max-w-2xl mx-auto mb-10">
          <p className="my-4">
            YapBay is a mission-oriented project that aims to knock down the
            walls that separate people financially across the globe.
          </p>
          <p className="my-4">
            Those walls separate people from each other, and from prosperity.
          </p>

          <p className="my-4">That&apos;s not ok.</p>

          <h2 className="text-3xl font-bold mb-4">Mission</h2>

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

          <h2 className="text-3xl font-bold mb-4">Team</h2>
          <p className="my-4">
            Currently the team is{" "}
            <Link href="https://georgedonnelly.com/portfolio/">
              George Donnelly
            </Link>
            , who has been working on crypto mass adoption since 2018. Visit
            <Link href="https://georgedonnelly.com/portfolio/">
              GeorgeDonnelly.com
            </Link>{" "}
            for more information.
          </p>
          <h2 className="text-3xl font-bold mb-4">
            Early Positioning Thoughts
          </h2>

          <h3 className="text-xl font-bold my-4">Tagline</h3>
          <ul className="list-disc pl-5">
            <li>Route around TradFi limits with Web3</li>
            <li>Web3 Remittances</li>
            <li>Fiat to Fiat Remittances for the Whole World</li>
            <li>Zapier for TradFi and Crypto</li>
            <li>TradFi lego blocks powered by Crypto</li>
            <li>Connect TradFi Networks with Web3</li>
            <li>DeFi built on TradFi, by Web3</li>
            <li>
              Zero protocol KYC. Zero withdrawal fees. Zero geo-blocking. Trade
              free.
            </li>
            <li>LocalBitcoins 2.0</li>
          </ul>
          <h3 className="text-xl font-bold my-4">One Sentence </h3>
          <ul className="list-disc pl-5">
            <li>
              <p>
                Fiat to fiat remittances using cryptocurrency that are cheaper,
                faster and less problematic than legacy remittances services.
              </p>
            </li>
            <li>
              <p>
                Chain together fiat and crypto transactions to escape capital
                controls and move money across borders quickly and cheaply.
              </p>
            </li>
            <li>
              <p>
                YapBay enables you to earn from your existing TradFi accounts.
              </p>
            </li>
          </ul>
          <h3 className="text-xl font-bold my-4">
            Elevator Speech (needs work)
          </h3>
          <p className="my-4">
            Remittances today is a $700 billion industry with high fees,
            excessive paperwork and excessive identity requirements that people
            often can not meet or do not want to meet.
          </p>
          <p className="my-4">
            TradFi payment networks often don&#39;t talk to each other. Or,
            worse, they place obstacles to moving your money from network to
            another.
          </p>
          <p className="my-4">
            With YapBay, you put your TradFi accounts on-chain along with your
            preferred transaction parameters: amounts, buy and/or sell, times of
            day available, fiat pay/receive options, DM options, description of
            what is being offered, counterparty identity requirements, etc. You
            decide the conditions under which you participate in chained
            transactions.
          </p>
          <p className="my-4">
            When new orders come into the system that match an existing profile,
            notifications are sent, so transactions can be created.
          </p>
          <p className="my-4">
            The system traces a path and offers options, so it&#39;s like a
            complex order-matching system that mixes crypto and fiat to route
            around legacy TradFi payment network limits.
          </p>
          <p className="my-4">
            Users sending remittances and other cross-border payments assemble
            the available TradFi and crypto building blocks into the
            transactions they need, routing around capital controls, legacy
            TradFi payment networks and other obstacles to deliver funds for
            family support, business, to pay medical expenses, education
            expenses and to found new small enterprises.
          </p>
          <p className="my-4">
            YapBay enables users to create countless bridges with TradFi and
            Crypto to permit funds to go anywhere, from fiat to crypto and back
            again -- So everyone can onboard to crypto, spend crypto at
            merchants, save crypto, and exit to fiat when needed.
          </p>
          <h3 className="text-xl font-bold my-4">Features </h3>
          <ul className="list-disc pl-5">
            <li>
              (novel) fiat to fiat remittances (using crypto as the transport
              layer)
            </li>
            <li>(novel) customizable escrow</li>
            <li>
              (novel) transaction-chaining (go from any asset to any other,
              routing around TradFi obstacles, and competing with TradFi
              remittances; including combo remittances where money in country X
              buys products/services in country Y)
            </li>
            <li>AI-assisted risk management for transaction participants</li>
            <li>
              AI-assisted dispute resolution plus decentralized dispute
              resolution
            </li>
            <li>AI-assisted order-matching and transaction building</li>
            <li>
              peer-to-peer (users trading directly with each other, lending
              their tradfi accounts, in a non-custodial manner)
            </li>
            <li>
              Web3 (users can own the platform via a DAO, trades are controlled
              by contracts)
            </li>
            <li>
              decentralized / unstoppable / censorship-resistant (if one
              domain/interface is unreachable, spin up another)
            </li>
            <li>identity and reputation</li>
            <li>open-source</li>
            <li>
              buyback-and-burn token (users are rewarded with tokens and
              transaction fees are used to buy back and burn the native token)
            </li>
            <li>no KYC/AML at the protocol level</li>
            <li>unlimited payment methods</li>
            <li>AI-assisted support</li>
            <li>
              global, without protocol-level geo-blocking and multi-lingual
            </li>
          </ul>
          <h3 className="text-xl font-bold my-4">Use Cases </h3>
          <ul className="list-disc pl-5">
            <li>
              make a remittance with fiat currency that also pays out in fiat,
              thus avoiding capital controls, excessive paperwork, high fees,
              failed transactions, privacy-invading identification requirements,
              etc.
            </li>
            <li>
              with fiat in country X, pre-pay a product or service that is
              delivered to the end user in country Y.
            </li>
            <li>
              enable people to receive remittances even if they do not have a
              working TradFi account.
            </li>
            <li>
              enable TradFi payment networks to talk to each other, reducing
              fees, delays and increasing the velocity of money.
            </li>
            <li>
              enable users in countries suffering crises to migrate with their
              savings.
            </li>
          </ul>
          <h3 className="text-xl font-bold my-4">Pain Points </h3>
          <ul className="list-disc pl-5">
            <li>frozen TradFi accounts</li>
            <li>inability to get TradFi accounts</li>
            <li>capital controls</li>
            <li>
              TradFi payment networks / ledgers that don&#39;t talk to each
              other or are excessively slow
            </li>
            <li>excessive remittance fees</li>
            <li>limited ATM withdrawals</li>
            <li>hyper-inflation</li>
            <li>
              economic and political crises, forced displacement, forced
              migration
            </li>
          </ul>
        </div>
      </Container>
    </main>
  );
}
