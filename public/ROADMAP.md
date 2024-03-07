# YapBay Roadmap

## Backdrop Build MVP

- User registration and profile management
- Offer creation and browsing
- Fiat-to-fiat wizard for efficient currency conversion
- Trade initiation, execution, and finalization
- Basic reputation system to assess user trustworthiness
- Off-chain storage of trade history for transparency and auditability

## Post-Hackathon

### Escrow

- m/n multi-sig escrow.
- automatic release via smart contract when certain conditions are met.
- has to dynamically take into account how many accounts are affected by the transaction.
- customization of escrow terms, such as length of time funds are held, conditions for release, custom contract clauses, etc.
- escrow fees adjustable based on reputation and transaction history of involved parties.
- transaction insurance for defaults, fraud, market crashes, etc.
- real-time tracking and notifications for each stage of escrow for all involved parties.
- consider ability for parties to unlock escrowed funds after x blocks with approval of certain other parties to the transaction, and an automatic return after y blocks.

### Payment Options

- seed the most popular payment options.
- try to find a list that can be imported.

### Listings 1.0

- add CRUD for listings.
- create index for listings with filtering.

### Reputation

- implement trader profiles including reviews and reputation via an algorithm based on platform use and (later) token staking.

## 1.0 Release

### UX

- add a wizard to build your transaction.
- integrate AI into the wizard.
- proactively offer trades to the user when they login that are based on their transaction history (opt-in feature), this as opposed to the classic P2P marketplace approach of having to essentially search the database by filtering global offers.
- enable users to build alerts such that they receive notifications when potential transactions/accounts meeting their criteria become available.
- enable deeper analytics to better understand user behavior, e.g., https://posthog.com/.
- enable remittances to be sent with a link over WhatsApp, Telegram, Instagram, etc., so that new users can be easily-onboarded, and then guided step by step.
- add a tool permitting users to split a single remittance payment, e.g., among various members of a family, to savings, direct to merchants for groceries, utility bills, education, etc.
- add hedging to permit users to secure the value of volatile crypto assets while the transaction is being assembled.

### Identity

- integrate with one or more leading Web3 identity services.
- give traders tools to solicit the identity of their trading partner.
- potential partners: https://www.clique.social, https://request.network, etc.
- build a web-of-trust by enabling traders to vouch for other traders under certain conditions, with consequences for the trust network when one of their members is found to commit fraud, etc.

### Accessibility

- add i18n and focus on the [top 25 languages](https://en.wikipedia.org/wiki/List_of_languages_by_total_number_of_speakers) over time.
- potential partners: https://nextra.site/

### Marketing

- build in ability to test different copy A/B style.
- add a native token and use it to reward the participants in completed transactions.
- add education resources, videos, docs, short tutorials, forums, etc. https://nextra.site/
- potential partners: https://taskon.xyz/, https://charmverse.io/, etc.
- foster a community of remittance senders, recipients, merchants and remittance businesses, both formal and informal.

### BizDev

- build relationships with remittance providers ("wholesalers") and offer them a custom interface (remittance gateway) to the system.
- create a starter kit, offer small businesses something interesting, maybe they pay something minor to get started.

### Dispute Resolution

- add AI to summarize transaction risks for the parties to a given transaction.
- integrate an AI-driven system that can help in initial dispute resolution by analyzing transaction data and past user behavior to suggest fair resolutions. If the dispute escalates, it can then be passed to human arbitrators.
- decentralize dispute resolution: design an algorithm to select a pool of users who can be selected from to resolve disputes. Factor in native token staking time, amount, etc.
- design incentives to encourage token staking.
- integrate with an arbitration solution and define a clear legal jurisdiction for dispute escalation, if need be.

### Security

- add 2FA, anti-phishing measures and other common security features.

### Extensibility

- more interfaces: desktop, PWA mobile, integrate with suitable wallets, etc.
- add an API to enable others to build on the network.

## Post-1.0 Routes to Explore

- monetization: competitive but perhaps based on the number of jumps?
- combo remittances: enable chaining of trades in a marketplace as well, so, e.g., fiat in country X to delivered groceries or health services in country Y.
- tiered reputation system
- 24-hour support.
- integrate a secure chat solution.
- social features.
- map-based navigation for liquidity, merchants, remittance "wholesalers" and other opportunities.
- form a DAO in which the native token is the governance token.
- remittance-backed microloans: use proof of recurring remittances as a low-risk credit signal.
- savings: offer recipients the option to save some of their remittance proceeds in an yield-bearing solutions.
- gig networks: compete with Rappi, Uber, etc., without the expensive centralized commissions.
- merchant network: connect merchants to the marketplace for liquidity, enable merchants to market themselves, their products and services, including discounts.
- recurring payments: enable users to program recurring payments with crypto-accepting merchants so they can pay bills straight with crypto.
- menu-based interface: an interface recognizable by M-Pesa users, perhaps even a hardware device. Or, integration with feature phones and similar devices in use in target markets. This, so that we can reach the most vulnerable and least tech-savvy potential users.
- cross-border donations/crowdfunding: with liquidity, we can disrupt the non-profit industry, cut out high-overhead middlemen and enable donors to directly experience their impact with local and national NGOs.
- support freelancer marketplaces: with liquidity, more freelancers can save on fees and time, as well as access clients across the globe who were previously inaccessible due to troublesome TradFi payment networks.
- cross-border B2B payment gateway: to facilitate international trade without having to jump through the hoops of banks, or be limited by them.
- property registries: corruption-free registries for real estate and other assets.
- time-locked contracts for long-term deals: for long-term agreements or installment-based payments, time-locked smart contracts can automatically release funds at specified intervals, ensuring commitment from both parties over the duration of the deal.
- white label: enable others to launch their own copies of yapbay, amalgamate liquidity, and make them searchable from a unified interface.
- pre-programmed trades, like limit orders.

## ToDo

- how to proactively verify the legitimacy of offers to avoid takers wasting time.
- how to integrate reputation from other P2P markets to bootstrap identity and reputation
- add predefined criteria for automatic acceptance of trades on offers so trades can start faster.
- add user paths to this

## Potential Integrations

### Identity

- ENS
- Sovrin
- uPort
- Civic
- Bloom
- CyberConnect

### Storage

- IPFS
- Filecoin
- Arweave
- OrbitDB
- PlanetScale (postgres)
- TheGraph

### Arbitration

- Kleros
- Aragon Court
- Gnosis Court

### Escrow

- Gnosis Safe
- Argent

### Oracles

- ChainLink

Consideration for GDPR compliance and user data privacy, especially for off-chain storage. Mechanisms for users to request data deletion or modification in compliance with such regulations could be necessary.

General: Implementing a circuit breaker or pause functionality could be vital for responding to detected vulnerabilities or attacks without needing a full migration to new contracts.

Batch Processing: For functions like reputation calculation, consider mechanisms for batch processing to optimize gas usage and scalability. This is especially relevant if operations can affect multiple users or offers simultaneously.

# User Paths

## Accounts

- user registers
- user updates profile information
- user endorses another user
- user browses another user's profile, including ratings, reputation score, past trades, offers (filterable by status)

## Offers

- maker (user) creates offer
- maker updates offer (strings, amounts, status)

## Trades

- taker (user) takes a trade offer from a maker
- taker chains together two offers
- maker accepts trade
- user changes trade status
  - user locks crypto in escrow
  - user marks fiat paid
  - user times out trade
  - user cancels trade
  - user refunds trade
  - user disputes trade
  - user finalizes trade (success)
  - user unlocks crypto from escrow

## Ratings

- user rates a trade

## Arbitration

- admin resolves a dispute with or without penalty to one or more parties

## Escrow

- user locks crypto in escrow
- user unlocks crypto in escrow
- admin disposes of crypto in escrow to resolve dispute
- admin penalizes crypto in escrow

## System Functions

- escrow and enforce conditions on escrow and trade status changes
- calculate reputation
- show offers (filterable)
- wizard to build chained transaction from 2 offers
