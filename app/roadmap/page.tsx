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
            <h3 className="text-2xl font-bold mt-4 mb-1">
              Week 1: A Very Simple MVP with Escrow
            </h3>
            <div>
              <h4 className="font-semibold mt-4 mb-1">Building Blocks</h4>
              <ul className="list-disc pl-5">
                <li>Design basic building blocks.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mt-4 mb-1">Escrow</h4>
              <ul className="list-disc pl-5">
                <li>m/n multi-sig escrow.</li>
                <li>
                  automatic release via smart contract when certain conditions
                  are met.
                </li>
                <li>
                  has to dynamically take into account how many accounts are
                  affected by the transaction.
                </li>
                <li>
                  customization of escrow terms, such as length of time funds
                  are held, conditions for release, custom contract clauses,
                  etc.
                </li>
                <li>
                  escrow fees adjustable based on reputation and transaction
                  history of involved parties.
                </li>
                <li>
                  transaction insurance for defaults, fraud, market crashes,
                  etc.
                </li>
                <li>
                  real-time tracking and notifications for each stage of escrow
                  for all involved parties.
                </li>
                <li>
                  consider ability for parties to unlock escrowed funds after x
                  blocks with approval of certain other parties to the
                  transaction, and an automatic return after y blocks.
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mt-4 mb-1">Payment Options</h4>
              <ul className="list-disc pl-5">
                <li>seed the most popular payment options.</li>
                <li>try to find a list that can be imported.</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mt-4 mb-1">Listings 1.0</h4>
              <ul className="list-disc pl-5">
                <li>add CRUD for listings.</li>
                <li>create index for listings with filtering.</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold mt-4 mb-1">
              Week 2: Transaction-Chaining MVP
            </h3>
            <ul className="list-disc pl-5">
              <li>add transaction-chaining.</li>
              <li>
                add a friendly UI to understand how the building blocks fit into
                the transaction whole.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-bold mt-4 mb-1">
              Week 3: Identity & Dispute Resolution MVP
            </h3>
            <ul className="list-disc pl-5">
              <li>implement centralized dispute resolution for now.</li>
              <li>
                implement trader profiles including reviews and reputation via
                an algorithm based on platform use and (later) token staking.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-2xl font-bold mt-4 mb-1">Week 4: UI</h3>
            <ul className="list-disc pl-5">
              <li>organize community testing.</li>
              <li>add an attractive, fast and helpful UI.</li>
              <li>make the demo video.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold">
              Stretch Goals / Post-MVP / 1.0
            </h2>
            <h3 className="text-2xl font-bold mt-4 mb-1">UX</h3>
            <ul className="list-disc pl-5">
              <li>add a wizard to build your transaction.</li>
              <li>integrate AI into the wizard.</li>
              <li>
                proactively offer trades to the user when they login that are
                based on their transaction history (opt-in feature), this as
                opposed to the classic P2P marketplace approach of having to
                essentially search the database by filtering global offers.
              </li>
              <li>
                enable users to build alerts such that they receive
                notifications when potential transactions/accounts meeting their
                criteria become available.
              </li>
              <li>
                enable deeper analytics to better understand user behavior,
                e.g., <a href="https://posthog.com/">https://posthog.com/</a>.
              </li>
              <li>
                enable remittances to be sent with a link over WhatsApp,
                Telegram, Instagram, etc., so that new users can be
                easily-onboarded, and then guided step by step.
              </li>
              <li>
                add a tool permitting users to split a single remittance
                payment, e.g., among various members of a family, to savings,
                direct to merchants for groceries, utility bills, education,
                etc.
              </li>
              <li>
                add hedging to permit users to secure the value of volatile
                crypto assets while the transaction is being assembled.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Identity</h3>
            <ul className="list-disc pl-5">
              <li>
                integrate with one or more leading Web3 identity services.
              </li>
              <li>
                give traders tools to solicit the identity of their trading
                partner.
              </li>
              <li>
                potential partners:{" "}
                <a href="https://www.clique.social">
                  https://www.clique.social
                </a>
                , <a href="https://request.network">https://request.network</a>,
                etc.
              </li>
              <li>
                build a web-of-trust by enabling traders to vouch for other
                traders under certain conditions, with consequences for the
                trust network when one of their members is found to commit
                fraud, etc.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Accessibility</h3>
            <ul className="list-disc pl-5">
              <li>
                add i18n and focus on the{" "}
                <a href="https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers">
                  top 25 languages
                </a>{" "}
                over time.
              </li>
              <li>
                potential partners:{" "}
                <a href="https://nextra.site/">https://nextra.site/</a>
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Marketing</h3>
            <ul className="list-disc pl-5">
              <li>build in ability to test different copy A/B style.</li>
              <li>
                add a native token and use it to reward the participants in
                completed transactions.
              </li>
              <li>
                add education resources, videos, docs, short tutorials, forums,
                etc. <a href="https://nextra.site/">https://nextra.site/</a>
              </li>
              <li>
                potential partners:{" "}
                <a href="https://taskon.xyz/">https://taskon.xyz/</a>,{" "}
                <a href="https://charmverse.io/">https://charmverse.io/</a>,
                etc.
              </li>
              <li>
                foster a community of remittance senders, recipients, merchants
                and remittance businesses, both formal and informal.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">BizDev</h3>
            <ul className="list-disc pl-5">
              <li>
                build relationships with remittance providers
                (&quot;wholesalers&quot;) and offer them a custom interface
                (remittance gateway) to the system.
              </li>
              <li>
                create a starter kit, offer small businesses something
                interesting, maybe they pay something minor to get started.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Dispute Resolution</h3>
            <ul className="list-disc pl-5">
              <li>
                add AI to summarize transaction risks for the parties to a given
                transaction.
              </li>
              <li>
                integrate an AI-driven system that can help in initial dispute
                resolution by analyzing transaction data and past user behavior
                to suggest fair resolutions. If the dispute escalates, it can
                then be passed to human arbitrators.
              </li>
              <li>
                decentralize dispute resolution: design an algorithm to select a
                pool of users who can be selected from to resolve disputes.
                Factor in native token staking time, amount, etc.
              </li>
              <li>design incentives to encourage token staking.</li>
              <li>
                integrate with an arbitration solution and define a clear legal
                jurisdiction for dispute escalation, if need be.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Security</h3>
            <ul className="list-disc pl-5">
              <li>
                add 2FA, anti-phishing measures and other common security
                features.
              </li>
            </ul>
            <h3 className="text-2xl font-bold mt-4 mb-1">Extensibility</h3>
            <ul className="list-disc pl-5">
              <li>
                more interfaces: desktop, PWA mobile, integrate with suitable
                wallets, etc.
              </li>
              <li>add an API to enable others to build on the network.</li>
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-bold">Post-1.0 Routes to Explore</h2>

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
        </div>
      </Container>
    </main>
  );
}
