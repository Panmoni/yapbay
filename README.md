# YapBay: P2P Stablecoin Remittances for the Global South

A Vite + React frontend for the [YapBay](https://YapBay.com/) P2P trading and remittances decentralized application (dapp) on Celo L2.

This repository serves as the user interface for YapBay, a decentralized peer-to-peer (P2P) exchange and remittances marketplace designed to facilitate secure, borderless cryptocurrency trading with fiat on-ramps and off-ramps.

![deck1](https://raw.githubusercontent.com/Panmoni/yapbay/refs/heads/main/public/deck1.png)

## Overview

### The Big Picture

YapBay is an EVM dapp for P2P trading and remittances that is targeting deployment on Celo L2 mainnet. Our mission is to break down traditional financial barriers and unlock economic potential in emerging markets by enabling direct, trustless trades between peers worldwide. We provide a decentralized alternative to centralized exchanges, prioritizing financial inclusion, flexibility and community ownership.

[Browse the deck](https://static.panmoni.com/yb/yapbay-deck.pdf)

[Read the about page](https://yapbay.com/about/)

#### Why It Matters
- **Financial Inclusion**: Over 1 billion people lack formal IDs and 2 billion are unbanked or underbanked. YapBay offers a KYC-free, accessible trading solution, empowering those excluded from traditional finance.
- **Affordable Remittances**: High remittance fees (6.2% globally in 2023 vs. the World Bank’s 3% target) disproportionately affect small transfers (sub-$200) to regions like Africa, Southeast Asia and Latin America. YapBay reduces costs by chaining P2P trades over stablecoin rails, bypassing expensive legacy systems and unlocking billions in trapped capital.
- **Economic Empowerment**: By facilitating low-cost, censorship-resistant fiat-to-fiat transactions, we enable families to access basic needs, support entrepreneurship and drive economic growth in underserved markets.
- **Decentralized Future**: Unlike Web2 platforms, we’re building a truly community-owned network, evolving with its users to transform developing economies into vibrant, connected markets.

#### Remittances Vision
YapBay reimagines remittances by allowing users to chain together P2P trades into seamless fiat-in, fiat-out transactions. Traders use USDC as a fast, low-cost transport layer, while senders and receivers interact solely in their preferred fiat currencies—no crypto knowledge required. This approach eliminates intermediaries, reduces fees and provides crisis-resilient access to funds. 

Beyond cash transfers, we aim to support "combo remittances," where senders can buy essentials (e.g., groceries, medicine) cross-border for their loved ones from local merchants for direct delivery to recipients, enhancing economic impact.

### Key Features
- **Secure Escrow**: Smart contracts ensure funds are safe until trades complete.
- **Flexible Fiat Options**: Trade with any fiat payment method—community-driven additions welcome.
- **Dispute Resolution**: Fair outcomes backed by evidence and arbitration.
- **Trust Network**: Build reputation and connect with local, verified traders.
- **Local Focus**: Trade in your currency with peers who understand your market.

## System Architecture

YapBay is a modular ecosystem of interconnected repositories working together to deliver a seamless P2P trading experience. Here’s how they connect:

1. **[yapbay-contracts-solidity](https://github.com/Panmoni/yapbay-contracts-solidity)**
    - **Role**: The on-chain backbone, a Solidity smart contract built with Hardhat.
    - **Functionality**: Manages escrow creation, funding, fiat payment confirmation, release, cancellation and dispute resolution for USDC trades (max 100 USDC during the MVP, 1% fee, 5% dispute bond).
    - **Connection**: The frontend interacts with these contracts via Ethereum wallet integrations (e.g., MetaMask) to sign and submit transactions like escrow funding or release.

2. **[ yapbay-api](https://github.com/Panmoni/yapbay-api)**
   - **Role**: REST API for managing accounts, offers, trades and escrow instructions.
   - **Functionality**: Handles user accounts, trade offers, trade state updates and generates transactions for on-chain actions. Uses PostgreSQL for storage and JWT for wallet-based authentication.
   - **Connection**: The frontend sends HTTP requests to this API to fetch trade data, post offers, or retrieve escrow instructions, which are then signed client-side.

3. **[yapbay](https://github.com/Panmoni/yapbay)** (this repo)
   - **Role**: The user interface, built with Vite + React.
   - **Functionality**: Displays trade offers, manages user interactions, integrates with Ethereum wallets and communicates with the API and pricing server.
   - **Connection**: Connects to the API for source-of-truth data and the contracts for on-chain actions, while querying the pricing server (via the API) for real-time fiat prices.

4. **[pricing](https://github.com/Panmoni/pricing)**
   - **Role**: Lightweight Express.js server for cryptocurrency price feeds.
   - **Functionality**: Provides real-time USDC prices in multiple fiat currencies (USD, EUR, COP, NGN, VES) using Coinranking API, cached with Redis.
   - **Connection**: The API queries this server’s `/prices` endpoint to display accurate fiat equivalents for trades. The frontend then talks to the API server to get the prices.

5. **yapbay-listener** (coming soon)
   - **Role**: TypeScript event listener for on-chain activities.
   - **Functionality**: Monitors Celo blockchain events (e.g., escrow creation, funding) to keep off-chain systems in sync.
   - **Connection**: Feeds real-time updates to the API and frontend via websockets or polling, ensuring UI reflects on-chain state.

6. **[yapbay-www](https://github.com/Panmoni/yapbay-www)**
   - **Role**: AstroJS static site for marketing and community engagement.
   - **Functionality**: Hosts the public-facing website (YapBay.com) with info about the project, roadmap and community links.
   - **Connection**: Links to the frontend for app access and serves as the entry point for new users.

### How It All Works Together
- A user visits `yapbay-www` to learn about the project and joins via the frontend.
- The frontend authenticates users via Ethereum wallet signatures, interacting with the API to create accounts or offers. It leverages https://dynamic.xyz.
- The pricing server provides fiat price data for offer creation and trade visualization.
- Trades are initiated via the API, which generates escrow instructions sent to the frontend for signing and submission to the contracts.
- The listener tracks on-chain events, updating the API in real-time.
- Disputes or completions are handled on-chain, with the frontend providing a seamless interface.  

### Previous Versions
- The 2024 version of yapbay is in the yapbay-2024 branch of this repo.
- Here are the 2024 contracts: [https://github.com/Panmoni/yapbay-contracts](https://github.com/Panmoni/yapbay-contracts)

## YapBay Background

YapBay is borne of [4 years of crypto mass adoption fieldwork in Latin America](https://georgedonnelly.com/portfolio/#1-crypto--web3), led by [George Donnelly](https://georgedonnelly.com/about/), in search of an answer to this question:

**How can we create sustainable inflows of cryptocurrency into the hands of new, repeat users, in particular in the developing world?**

During this time, the Panmoni team organized hundreds of in-person meetups across 20 cities in 8 countries on 3 continents to onboard new users to crypto self-custody with solid education and a safe approach.

In the process, we learned a great deal about the real-world problems that Web3 can solve in the developing world.

### Why Inflows Matter

Currently, few people have crypto, and those who do mostly see it as an investment.

With constant inflows of cryptocurrency, people can start to see it as a currency that they benefit from actually **using**.

It's not enough to offer people high-fee buy-in options. In fact, those options mean people have to hold their crypto and cheer for number-go-up. Otherwise, they are just losing money by entering crypto.

With regular inflows of crypto, people can be incentivized to stay in crypto and to spend crypto for everyday needs. To save in crypto. To do business in crypto.

This is how we get the next billion crypto users, and how we get them to see crypto as more than a game of betting to get the number to go up.

### Why Remittances

Remittances are a $900 billion industry where money must cross borders to be useful. This is precisely where cryptocurrency can be most useful right now, because fiat currency is meant to keep people pent up inside nation-state borders.

Crypto sets them free.

Furthermore, remittance fees and paperwork are prohibitively expensive across much of the globe. By building up liquidity and options, remittances can be cheaper and faster. We can use crypto first as a transport layer.

Later, we can provide incentives for users to keep their remittances in crypto, and then spend it at merchants.

This is the beginning of a viable crypto-first economy.

### Why the Developing World

TradFi works worst of all in the developing world. Payment networks don't talk to each other. Regulations are high. Identification is unreliable. Capital formation is compromised.

A great book on this topic is Hernando de Soto's _[The Mystery of Capital](https://www.goodreads.com/en/book/show/86154)_. _[The Bottom Billion](https://www.goodreads.com/book/show/493371.The_Bottom_Billion)_ is also enlightening.

All of this adds up to an enormous opportunity make assets liquid, release pent-up desire to form new capital and a unique opportunity to assist the 2 billion working people of the informal economy in creating amazing new prosperity for themselves, and for the rest of the world.

### TradFi-to-DeFi Lego Blocks

Yap Bay aims to create P2P fiat and crypto liquidity so that remittance senders can make remittances with fiat currency that trace a path through complex and fragmented TradFi payment networks, to get the money where it needs to go, using crypto as the transport layer.

By integrating fiat, we facilitate the entrance of crypto newbies who can use the currencies they are comfortable with.

By using crypto, we bridge disconnected fiat payment networks to get the funds where they need to go, faster and cheaper than current TradFi remittance options.

In this way, we will disrupt TradFi remittances, and give birth to sustainable crypto inflows which can shower thousands of local economies with crypto inflows, giving a needed boost to vibrant crypto economies.

### Mission

Yap Bay is on a mission to facilitate access to cryptocurrency for people across the globe, without having to endure onerous KYC or the arbitrary limits and opaque reserves status of centralized exchanges (CEXs).

We are building the Yap Bay P2P crypto exchange so anyone, anywhere can have uncensorable, KYC-free, transparent and open-source fiat on- and off-ramps.

We see this as making a meaningful contribution towards the goal of facilitating access to prosperity for people across the globe who have been denied access to the full benefits of an accountable monetary system.

Towards that end, we seek to work with individuals, teams, chains and anyone who is also excited about this mission.

### Vision

We envision a world of universal prosperity, where every human being has the opportunity to realize their potential.

We envision a world where everyone, everywhere enjoys monetary freedom; and may use and create money as they see fit, trading it on a voluntary basis across borders, from anywhere to anywhere, from anyone to anyone.

We envision a world of crypto mass adoption, where everyone has access to prosperity, where no one is cut out of the system or left behind.

We envision a world free from large-scale oppressive forces such as nation-states and rent-seeking intermediaries such as banks, so that individuals can develop as they see fit, entering into voluntary relationships with each other by mutual agreement, without interference from those who would unjustly tilt the playing field in their own favor using aggressive institutions or unfair restrictions on our liberty.


## Community
Join us to shape the future of decentralized trading and remittances:

- Telegram: Connect with the community in [English](https://t.me/Panmoni/288) or [Español](https://t.me/Panmoni/291).
- Waitlist: https://getwaitlist.com/waitlist/17774
- X: Follow updates. [@YapBay_](https://x.com/YapBay_)
- Website: https://YapBay.com

## License
MIT - See LICENSE for details.
