// page.tsx

import Container from "@/components/blog/container";
import { PageTitle } from "@/components/ui/PageTitle";

export default function Roadmap() {
  return (
    <main>
      <Container>
        <PageTitle
          title="YapBay Roadmap"
          description="Committed to building."
        />
        <div className="my-12 space-y-8">
          <section>
            <h2 className="text-4xl font-bold mt-4 mb-1">Backdrop Build MVP</h2>
            <ul className="list-disc pl-5">
              <li>User registration and profile management</li>
              <li>Offer creation and browsing</li>
              <li>Fiat-to-fiat wizard for efficient currency conversion</li>
              <li>Trade initiation, execution, and finalization</li>
              <li>Basic reputation system to assess user trustworthiness</li>
              <li>
                Off-chain storage of trade history for transparency and
                auditability
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-4xl font-bold mt-4 mb-1">Post-Hackathon</h2>
            <h3 className="text-2xl font-bold mt-4 mb-1">Escrow</h3>
            <ul className="list-disc pl-5">
              <li>m/n multi-sig escrow.</li>
              <li>
                Automatic release via smart contract when certain conditions are
                met.
              </li>
              <li>
                Has to dynamically take into account how many accounts are
                affected by the transaction.
              </li>
              <li>
                Customization of escrow terms, such as length of time funds are
                held, conditions for release, custom contract clauses, etc.
              </li>
              <li>
                Escrow fees adjustable based on reputation and transaction
                history of involved parties.
              </li>
              <li>
                Transaction insurance for defaults, fraud, market crashes, etc.
              </li>
              <li>
                Real-time tracking and notifications for each stage of escrow
                for all involved parties.
              </li>
              <li>
                Consider ability for parties to unlock escrowed funds after x
                blocks with approval of certain other parties to the
                transaction, and an automatic return after y blocks.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Payment Options</h3>
            <ul className="list-disc pl-5">
              <li>Seed the most popular payment options.</li>
              <li>Try to find a list that can be imported.</li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Listings 1.0</h3>
            <ul className="list-disc pl-5">
              <li>Add CRUD for listings.</li>
              <li>Create index for listings with filtering.</li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Reputation</h3>
            <ul className="list-disc pl-5">
              <li>
                Implement trader profiles including reviews and reputation via
                an algorithm based on platform use and (later) token staking.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-4xl font-bold mt-4 mb-1">1.0 Release</h2>
            <h3 className="text-2xl font-bold mt-4 mb-1">UX</h3>
            <ul className="list-disc pl-5">
              <li>Add a wizard to build your transaction.</li>
              <li>Integrate AI into the wizard.</li>
              <li>
                Proactively offer trades to the user when they login that are
                based on their transaction history (opt-in feature), this as
                opposed to the classic P2P marketplace approach of having to
                essentially search the database by filtering global offers.
              </li>
              <li>
                Enable users to build alerts such that they receive
                notifications when potential transactions/accounts meeting their
                criteria become available.
              </li>
              <li>
                Enable deeper analytics to better understand user behavior,
                e.g.,{" "}
                <a href="https://posthog.com/" className="text-blue-500">
                  https://posthog.com/
                </a>
                .
              </li>
              <li>
                Enable remittances to be sent with a link over WhatsApp,
                Telegram, Instagram, etc., so that new users can be
                easily-onboarded, and then guided step by step.
              </li>
              <li>
                Add a tool permitting users to split a single remittance
                payment, e.g., among various members of a family, to savings,
                direct to merchants for groceries, utility bills, education,
                etc.
              </li>
              <li>
                Add hedging to permit users to secure the value of volatile
                crypto assets while the transaction is being assembled.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Identity</h3>
            <ul className="list-disc pl-5">
              <li>
                Integrate with one or more leading Web3 identity services.
              </li>
              <li>
                Give traders tools to solicit the identity of their trading
                partner.
              </li>
              <li>
                Potential partners:{" "}
                <a href="https://www.clique.social" className="text-blue-500">
                  https://www.clique.social
                </a>
                ,{" "}
                <a href="https://request.network" className="text-blue-500">
                  https://request.network
                </a>
                , etc.
              </li>
              <li>
                Build a web-of-trust by enabling traders to vouch for other
                traders under certain conditions, with consequences for the
                trust network when one of their members is found to commit
                fraud, etc.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Accessibility</h3>
            <ul className="list-disc pl-5">
              <li>
                Add i18n and focus on the{" "}
                <a
                  href="https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers"
                  className="text-blue-500"
                >
                  top 25 languages
                </a>{" "}
                over time.
              </li>
              <li>
                Potential partners:{" "}
                <a href="https://nextra.site/" className="text-blue-500">
                  https://nextra.site/
                </a>
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Marketing</h3>
            <ul className="list-disc pl-5">
              <li>Build in ability to test different copy A/B style.</li>
              <li>
                Add a native token and use it to reward the participants in
                completed transactions.
              </li>
              <li>
                Add education resources, videos, docs, short tutorials, forums,
                etc.{" "}
                <a href="https://nextra.site/" className="text-blue-500">
                  https://nextra.site/
                </a>
              </li>
              <li>
                Potential partners:{" "}
                <a href="https://taskon.xyz/" className="text-blue-500">
                  https://taskon.xyz/
                </a>
                ,{" "}
                <a href="https://charmverse.io/" className="text-blue-500">
                  https://charmverse.io/
                </a>
                , etc.
              </li>
              <li>
                Foster a community of remittance senders, recipients, merchants
                and remittance businesses, both formal and informal.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">BizDev</h3>
            <ul className="list-disc pl-5">
              <li>
                Build relationships with remittance providers
                (&quot;wholesalers&quot;) and offer them a custom interface
                (remittance gateway) to the system.
              </li>
              <li>
                Create a starter kit, offer small businesses something
                interesting, maybe they pay something minor to get started.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Dispute Resolution</h3>
            <ul className="list-disc pl-5">
              <li>
                Add AI to summarize transaction risks for the parties to a given
                transaction.
              </li>
              <li>
                Integrate an AI-driven system that can help in initial dispute
                resolution by analyzing transaction data and past user behavior
                to suggest fair resolutions. If the dispute escalates, it can
                then be passed to human arbitrators.
              </li>
              <li>
                Decentralize dispute resolution: design an algorithm to select a
                pool of users who can be selected from to resolve disputes.
                Factor in native token staking time, amount, etc.
              </li>
              <li>Design incentives to encourage token staking.</li>
              <li>
                Integrate with an arbitration solution and define a clear legal
                jurisdiction for dispute escalation, if need be.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Security</h3>
            <ul className="list-disc pl-5">
              <li>
                Add 2FA, anti-phishing measures and other common security
                features.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Extensibility</h3>
            <ul className="list-disc pl-5">
              <li>
                More interfaces: desktop, PWA mobile, integrate with suitable
                wallets, etc.
              </li>
              <li>Add an API to enable others to build on the network.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-4xl font-bold mt-4 mb-1">
              Post-1.0 Routes to Explore
            </h2>
            <ul className="list-disc pl-5">
              <li>
                monetization: competitive but perhaps based on the number of
                jumps?
              </li>
              <li>
                combo remittances: enable chaining of trades in a marketplace as
                well, so, e.g., fiat in country X to delivered groceries or
                health services in country Y.
              </li>
              <li>tiered reputation system</li>
              <li>24-hour support.</li>
              <li>integrate a secure chat solution.</li>
              <li>social features.</li>
              <li>
                map-based navigation for liquidity, merchants, remittance
                &quot;wholesalers&quot; and other opportunities.
              </li>
              <li>
                form a DAO in which the native token is the governance token.
              </li>
              <li>
                remittance-backed microloans: use proof of recurring remittances
                as a low-risk credit signal.
              </li>
              <li>
                savings: offer recipients the option to save some of their
                remittance proceeds in an yield-bearing solutions.
              </li>
              <li>
                gig networks: compete with Rappi, Uber, etc., without the
                expensive centralized commissions.
              </li>
              <li>
                merchant network: connect merchants to the marketplace for
                liquidity, enable merchants to market themselves, their products
                and services, including discounts.
              </li>
              <li>
                recurring payments: enable users to program recurring payments
                with crypto-accepting merchants so they can pay bills straight
                with crypto.
              </li>
              <li>
                menu-based interface: an interface recognizable by M-Pesa users,
                perhaps even a hardware device. Or, integration with feature
                phones and similar devices in use in target markets. This, so
                that we can reach the most vulnerable and least tech-savvy
                potential users.
              </li>
              <li>
                cross-border donations/crowdfunding: with liquidity, we can
                disrupt the non-profit industry, cut out high-overhead middlemen
                and enable donors to directly experience their impact with local
                and national NGOs.
              </li>
              <li>
                support freelancer marketplaces: with liquidity, more
                freelancers can save on fees and time, as well as access clients
                across the globe who were previously inaccessible due to
                troublesome TradFi payment networks.
              </li>
              <li>
                cross-border B2B payment gateway: to facilitate international
                trade without having to jump through the hoops of banks, or be
                limited by them.
              </li>
              <li>
                property registries: corruption-free registries for real estate
                and other assets.
              </li>
              <li>
                time-locked contracts for long-term deals: for long-term
                agreements or installment-based payments, time-locked smart
                contracts can automatically release funds at specified
                intervals, ensuring commitment from both parties over the
                duration of the deal.
              </li>
              <li>
                white label: enable others to launch their own copies of yapbay,
                amalgamate liquidity, and make them searchable from a unified
                interface.
              </li>
              <li>pre-programmed trades, like limit orders.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-4xl font-bold mt-4 mb-1">ToDo</h2>
            <ul className="list-disc pl-5">
              <li>
                how to proactively verify the legitimacy of offers to avoid
                takers wasting time.
              </li>
              <li>
                how to integrate reputation from other P2P markets to bootstrap
                identity and reputation
              </li>
              <li>
                add predefined criteria for automatic acceptance of trades on
                offers so trades can start faster.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-4xl font-bold mt-4 mb-1">
              Potential Integrations
            </h2>

            <h3 className="text-2xl font-bold mt-4 mb-1">Identity</h3>
            <ul className="list-disc pl-5">
              <li>ENS</li>
              <li>Sovrin</li>
              <li>uPort</li>
              <li>Civic</li>
              <li>Bloom</li>
              <li>CyberConnect</li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Storage</h3>
            <ul className="list-disc pl-5">
              <li>IPFS</li>
              <li>Filecoin</li>
              <li>Arweave</li>
              <li>OrbitDB</li>
              <li>PlanetScale (postgres)</li>
              <li>TheGraph</li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Arbitration</h3>
            <ul className="list-disc pl-5">
              <li>Kleros</li>
              <li>Aragon Court</li>
              <li>Gnosis Court</li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Escrow</h3>
            <ul className="list-disc pl-5">
              <li>Gnosis Safe</li>
              <li>Argent</li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Oracles</h3>
            <ul className="list-disc pl-5">
              <li>ChainLink</li>
            </ul>
            <p className="mt-4 mb-1">
              Consideration for GDPR compliance and user data privacy,
              especially for off-chain storage. Mechanisms for users to request
              data deletion or modification in compliance with such regulations
              could be necessary.
            </p>
            <p className="mt-4 mb-1">
              General: Implementing a circuit breaker or pause functionality
              could be vital for responding to detected vulnerabilities or
              attacks without needing a full migration to new contracts.
            </p>
            <p className="mt-4 mb-1">
              Batch Processing: For functions like reputation calculation,
              consider mechanisms for batch processing to optimize gas usage and
              scalability. This is especially relevant if operations can affect
              multiple users or offers simultaneously.
            </p>
          </section>

          <section>
            <h2 className="text-4xl font-bold mt-4 mb-1">User Paths</h2>
            <h3 className="text-2xl font-bold mt-4 mb-1">Accounts</h3>
            <ul className="list-disc pl-5">
              <li>user registers</li>
              <li>user updates profile information</li>
              <li>user endorses another user</li>
              <li>
                user browses another user&#39;s profile, including ratings,
                reputation score, past trades, offers (filterable by status)
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Offers</h3>
            <ul className="list-disc pl-5">
              <li>maker (user) creates offer</li>
              <li>maker updates offer (strings, amounts, status)</li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Trades</h3>
            <ul className="list-disc pl-5">
              <li>taker (user) takes a trade offer from a maker</li>
              <li>taker chains together two offers</li>
              <li>maker accepts trade</li>
              <li>
                user changes trade status
                <ul className="list-disc pl-5">
                  <li>user locks crypto in escrow</li>
                  <li>user marks fiat paid</li>
                  <li>user times out trade</li>
                  <li>user cancels trade</li>
                  <li>user refunds trade</li>
                  <li>user disputes trade</li>
                  <li>user finalizes trade (success)</li>
                  <li>user unlocks crypto from escrow</li>
                </ul>
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Ratings</h3>
            <ul className="list-disc pl-5">
              <li>user rates a trade</li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Arbitration</h3>
            <ul className="list-disc pl-5">
              <li>
                admin resolves a dispute with or without penalty to one or more
                parties
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Escrow</h3>
            <ul className="list-disc pl-5">
              <li>user locks crypto in escrow</li>
              <li>user unlocks crypto in escrow</li>
              <li>admin disposes of crypto in escrow to resolve dispute</li>
              <li>admin penalizes crypto in escrow</li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">System Functions</h3>
            <ul className="list-disc pl-5">
              <li>
                escrow and enforce conditions on escrow and trade status changes
              </li>
              <li>calculate reputation</li>
              <li>show offers (filterable)</li>
              <li>wizard to build chained transaction from 2 offers</li>
            </ul>
          </section>
        </div>
      </Container>
    </main>
  );
}
