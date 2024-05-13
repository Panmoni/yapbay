# YapBay Roadmap

## MVP 1: 0.1.0

### Escrow

- m/n multi-sig escrow.
- Automatic release via smart contract when certain conditions are met.
- Has to dynamically take into account how many accounts are affected by the transaction.
- Customization of escrow terms, such as length of time funds are held, conditions for release, custom contract clauses, etc.

### Contracts

- Address current action items.

### UI

- Trade initiation, execution, and finalization.
- Add full contract functionality to the site.

### Payment Options

- Seed the most popular payment options. Try to find a list that can be imported.
- Add CRUD for listings.
- Create index for listings with filtering.

### Deployment

- Deploy on Arb and Morph testnets.

## Get Feedback Round 1

- Select target markets / remittance corridors.
- Recruit users.
- Do remote video UX testing and interviews.

## MVP 2: 0.2.0

- implement feedback from previous feedback round.

### Contracts

- Implement proxy pattern. Diamond Pattern vs OpenZeppelin upgradeable?
- time lock, multi-sig to control it.
- Implement error handling contract, input validation, access control, etc. handle system-wide errors in all the contracts. Define clear error codes and messages for different types of errors and exceptions. log errors.
- Write unit tests to cover various scenarios, including edge cases and error conditions.
- Perform integration tests with the Trade and Arbitration contracts to verify the correct flow of data and actions between the contracts.

### Reputation

- Implement trader profiles including reviews and reputation via an algorithm based on platform use.

## Get Feedback 2

- Expand base of testers.
- Do more interviews.
- Develop more liquidity providers and get their feedback.
- Talk to wholesalers, i.e., small remittance operations.

## MVP 3 0.3.0

- implement feedback from previous feedback round.

### UX

- Add a wizard to build your transaction.
- Integrate AI into the wizard.
- Proactively offer trades to the user when they login that are based on their transaction history (opt-in feature), this as opposed to the classic P2P marketplace approach of having to essentially search the database by filtering global offers.
- Enable users to build alerts such that they receive notifications when potential transactions/accounts meeting their criteria become available.
- Enable deeper analytics to better understand user behavior.

## Get Feedback 3

- Do some in-person UX testing.

### BizDev

- Build relationships with remittance providers ("wholesalers") and offer them a custom interface (remittance gateway) to the system.
- Create a starter kit, offer small businesses something interesting, maybe they pay something minor to get started.

## MVP 4 0.4.0

- implement feedback from previous feedback round.

### Accessibility

- Add i18n and focus on the top 5 languages.

### Marketing

- Build in ability to test different copy A/B style.
- Add education resources, videos, docs, short tutorials, forums, etc.
- Foster a community of remittance senders, recipients, merchants and remittance businesses, both formal and informal.

## Get Feedback 4

- Continue UX testing with users, wholesalers, liquidity providers, etc.

## MVP 5 0.5.0

- implement feedback from previous feedback round.

### UX

- Enable remittances to be sent with a link over WhatsApp, Telegram, Instagram, etc., so that new users can be easily-onboarded, and then guided step by step.
- Add a tool permitting users to split a single remittance payment, e.g., among various members of a family, to savings, direct to merchants for groceries, utility bills, education, etc.

## Get Feedback 5

- Continue UX testing with users, wholesalers, liquidity providers, etc.

## MVP 6 0.6.0

- implement feedback from previous feedback round.

### Identity

- Integrate with one or more leading Web3 identity services.
- Give traders tools to verify the identity of their trading partner.
- Build a web-of-trust by enabling traders to vouch for other traders under certain conditions, with consequences for the trust network when one of their members is found to commit fraud, etc.

### Deployment

- Deploy on mainnet in alpha status.

## Get Feedback 6

- Continue UX testing with users, wholesalers, liquidity providers, etc.

## MVP 7 0.7.0

- implement feedback from previous feedback round.

### Dispute Resolution

- Add AI to summarize transaction risks for the parties to a given transaction.
- Integrate an AI-driven system that can help in initial dispute resolution by analyzing transaction data and past user behavior to suggest fair resolutions. If the dispute escalates, it can then be passed to human arbitrators.

### Security

- Add 2FA, anti-phishing measures and other common security features.
- Implement a circuit breaker or pause functionality could be vital for responding to detected vulnerabilities or attacks without needing a full migration to new contracts.

## Get Feedback 7

- Continue UX testing with users, wholesalers, liquidity providers, etc.
- Travel to locations in target markets and do in-person meetup and UX testing.

## MVP 8 0.8.0

- implement feedback from previous feedback round.

### Merchants

- Add combo remittances: enable chaining of trades in a marketplace as well, so, e.g., fiat in country X to delivered groceries or health services in country Y.

### Escrow

- perfect sequential escrow based on current best practices
- Escrow fees adjustable based on reputation and transaction history of involved parties.
- Transaction insurance for defaults, fraud, market crashes, etc.
- Real-time tracking and notifications for each stage of escrow for all involved parties.
- Consider ability for parties to unlock escrowed funds after x blocks with approval of certain other parties to the transaction, and an automatic return after y blocks.

### Deployment

- Deploy on mainnet in beta status.

## Get Feedback 8

- Continue UX testing with users, wholesalers, liquidity providers, etc.
- Onboard some test merchants with combo remittances.

## MVP 9 0.9.0

- implement feedback from previous feedback round.

### Security

Add risk assessment tools.
how to proactively verify the legitimacy of offers to avoid takers wasting time.

### UX

- Estimated transaction execution times, to manage expectations.
- add predefined criteria for automatic acceptance of trades on offers so trades can start faster.
- Add initial ability to connect some bank accounts via API.

### Dispute Resolution

- Decentralize dispute resolution: design an algorithm to select a pool of users who can be selected from to resolve disputes. Factor in native token staking time, amount, etc.
- Integrate with an arbitration solution and define a clear legal jurisdiction for dispute escalation, if need be.

## 1.0 Release

- implement feedback from previous feedback round.

### Reputation

- Integrate reputation from other P2P markets to bootstrap identity and reputation.

### Token

- Add a native token and use it to reward the participants in completed transactions.

### Deployment

- Deploy on mainnet in production status.

## Possibilities Beyond 1.0

- More interfaces: desktop, PWA mobile, chat, integrate with suitable wallets, etc.
- Add an API to enable others to build on the network.
- Token staking to earn a portion of fees.
- Off-chain storage of trade history for transparency and auditability
- Consideration for GDPR compliance and user data privacy, especially for off-chain storage. Mechanisms for users to request data deletion or modification in compliance with such regulations could be necessary.
- Batch Processing: For functions like reputation calculation, consider mechanisms for batch processing to optimize gas usage and scalability. This is especially relevant if operations can affect multiple users or offers simultaneously.
- Fiat-to-fiat wizard for efficient currency conversion
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
- Saved Transactions, especially for recurring transactions.
- integrate token staking into reputation.
- Add hedging to permit users to secure the value of volatile crypto assets while the transaction is being assembled.

## User Paths

### Accounts

- user registers
- user updates profile information
- user endorses another user
- user browses another user's profile, including ratings, reputation score, past trades, offers (filterable by status)

### Offers

- maker (user) creates offer
- maker updates offer (strings, amounts, status)
- Trades
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

### Ratings

- user rates a trade

### Arbitration

- admin resolves a dispute with or without penalty to one or more parties

### Escrow

- user locks crypto in escrow
- user unlocks crypto in escrow
- admin disposes of crypto in escrow to resolve dispute
- admin penalizes crypto in escrow
- escrow and enforce conditions on escrow and trade status changes

### System Functions (off-chain)

- calculate reputation

## Potential Integrations

- Privy.io
- Charmverse.io
- Identity
- ENS
- Sovrin
- uPort
- Civic
- Bloom
- CyberConnect
- Storage
- IPFS
- Filecoin
- Arweave
- OrbitDB
- Postgres
- TheGraph
- Arbitration
- Kleros
- Aragon Court
- Gnosis Court
- Escrow
- Gnosis Safe
- Argent
- Oracles
- ChainLink
- Nextra
- PostHog
