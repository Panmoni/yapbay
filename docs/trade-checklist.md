# Successful Trade Checklist

A step-by-step checklist for ensuring a trade completes successfully in YapBay.

## What Works

- trade creation
- statuses are right, create escrow button appears for seller.
- deadline countdown and auto cancel for escrow payment works.
  -post cancellation statuses are right
  - trade cancellations table is working

## Pre-Trade Setup ✅

- [ ] Buyer and seller accounts exist and are loaded in the UI
- [ ] Relevant offer details fetched and displayed
- [ ] Trade record created via API (`POST /trades`) and loaded in TradePage

## Escrow Creation & Funding (Seller)

- [ ] Seller’s wallet is connected and provides `getWalletClient` & `getPublicClient`
- [ ] Seller has sufficient token allowance for the escrow contract (via `getTokenAllowance` / `approveTokenSpending`)
- [ ] `createEscrowTransaction` submitted on-chain with correct `tradeId`, `buyer`, and `amount`
- [ ] Transaction mined and confirmed
- [ ] Backend `recordEscrow` API called with `trade_id`, `escrow_id`, `transaction_hash`, addresses, and amount
- [ ] Trade leg state updates to **FUNDED** (UI shows “Escrow funded, pending fiat payment”)

events

## Fiat Payment (Buyer)

- [ ] Buyer initiates fiat payment off-chain (bank/fiat rails)
- [ ] Buyer clicks **Mark as Paid** in UI
- [ ] `markFiatPaidTransaction` submitted on-chain with correct `escrowId`
- [ ] Transaction mined and confirmed
- [ ] Backend `markFiatPaid` API updates trade record (`{ fiat_paid: true }`)
- [ ] Trade leg state updates to **PENDING_CRYPTO_RELEASE** (UI shows “Waiting for seller to release crypto”)

## Crypto Release (Seller)

- [ ] Seller reviews escrow balance and confirms receipt of fiat
- [ ] Seller clicks **Release Crypto** in UI
- [ ] Backend `releaseEscrow` API called with `escrow_id`, `trade_id`, authority and token account details
- [ ] On-chain funds released to buyer’s token account
- [ ] Trade leg state updates to **COMPLETED** or **RELEASED**

## Completion

- [ ] Overall trade status updates to **COMPLETED**
- [ ] UI displays final success message (`Trade completed successfully`)
- [ ] Both buyer and seller can view the finalized trade details

---

_Reference: See `src/utils/tradeStates.ts` for state definitions and `src/components/Trade/TradeStatusDisplay` for UI logic._
