# State Reference for YapBay

This document serves as the definitive state reference for the YapBay repository, covering both API/blockchain states and frontend-specific states.

## API and Blockchain States

### Escrow States (API/Blockchain)

| State       | Description                           | Triggered By                                               | Next States                         | Reference                                    |
| ----------- | ------------------------------------- | ---------------------------------------------------------- | ----------------------------------- | -------------------------------------------- |
| `CREATED`   | Initial state when escrow is created  | `EscrowCreated` event                                      | `FUNDED`, `CANCELLED`               | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `FUNDED`    | Escrow has been funded with crypto    | `FundsDeposited` event (when escrow is in `CREATED` state) | `RELEASED`, `CANCELLED`, `DISPUTED` | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `RELEASED`  | Funds have been released to the buyer | `EscrowReleased` event                                     | (Terminal state)                    | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `CANCELLED` | Escrow has been cancelled             | `EscrowCancelled` event                                    | (Terminal state)                    | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `DISPUTED`  | Escrow is in dispute                  | `DisputeOpened` event                                      | `RESOLVED`                          | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `RESOLVED`  | Dispute has been resolved             | `DisputeResponse` or `DisputeResolved` event               | (Terminal state)                    | `src/api/index.ts`, `src/utils/tradeStates.ts` |

### Additional Escrow Fields

| Field                       | Type    | Description                                                                                                                                       |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fiat_paid`                 | Boolean | Set to `TRUE` when fiat payment is confirmed. Updated by `FundsDeposited` event (when escrow is not in `CREATED` state) or `FiatMarkedPaid` event |
| `counter`                   | Integer | Counter value from the contract, incremented with each deposit. Updated by `FundsDeposited` event                                                 |
| `sequential_escrow_address` | String  | Address of sequential escrow. Updated by `SequentialAddressUpdated` event                                                                         |

### Trade Leg States (API/Blockchain)

| State       | Description                             | Triggered By                                                                             | Next States                                      | Reference                                    |
| ----------- | --------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------- |
| `CREATED`   | Initial state when trade leg is created | `EscrowCreated` event                                                                    | `FUNDED`, `CANCELLED`                            | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `FUNDED`    | Trade leg has been funded with crypto   | `FundsDeposited` event (when escrow is in `CREATED` state)                               | `FIAT_PAID`, `RELEASED`, `CANCELLED`, `DISPUTED` | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `FIAT_PAID` | Fiat payment has been confirmed         | `FundsDeposited` event (when escrow is not in `CREATED` state) or `FiatMarkedPaid` event | `RELEASED`, `DISPUTED`                           | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `RELEASED`  | Funds have been released to the buyer   | `EscrowReleased` event                                                                   | (Terminal state)                                 | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `CANCELLED` | Trade leg has been cancelled            | `EscrowCancelled` event                                                                  | (Terminal state)                                 | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `DISPUTED`  | Trade leg is in dispute                 | `DisputeOpened` event                                                                    | `RESOLVED`                                       | `src/api/index.ts`, `src/utils/tradeStates.ts` |
| `RESOLVED`  | Dispute has been resolved               | `DisputeResponse` or `DisputeResolved` event                                             | (Terminal state)                                 | `src/api/index.ts`, `src/utils/tradeStates.ts` |

### Additional Trade Fields

| Field                    | Type      | Description                                                                               |
| ------------------------ | --------- | ----------------------------------------------------------------------------------------- |
| `leg1_fiat_paid_at`      | Timestamp | When fiat was marked as paid for leg 1. Set by `FundsDeposited` or `FiatMarkedPaid` event |
| `leg2_fiat_paid_at`      | Timestamp | When fiat was marked as paid for leg 2. Set by `FundsDeposited` event                     |
| `leg1_escrow_onchain_id` | String    | Onchain ID of the escrow for leg 1. Set by `EscrowCreated` event                          |
| `leg2_escrow_onchain_id` | String    | Onchain ID of the escrow for leg 2. Set by `EscrowCreated` event (for sequential escrows) |

### Dispute States (API/Blockchain)

| State        | Description                                    | Triggered By                | Next States        | Reference                                    |
| ------------ | ---------------------------------------------- | --------------------------- | ------------------ | -------------------------------------------- |
| `OPENED`     | Initial state when a dispute is opened         | `DisputeOpened` event       | `RESPONDED`        | `src/utils/tradeStates.ts`                   |
| `RESPONDED`  | State after the other party has responded      | `DisputeResponse` event     | `RESOLVED`         | `src/utils/tradeStates.ts`                   |
| `RESOLVED`   | State after the arbitrator resolves the dispute| `DisputeResolved` event     | (Terminal state)   | `src/utils/tradeStates.ts`                   |
| `DEFAULTED`  | State if a party fails to respond in time      | Timeout                     | (Terminal state)   | `src/utils/tradeStates.ts`                   |

### Transaction Types (API)

| Transaction Type      | Description                                    | Related State Transition                           | Reference                                    |
| --------------------- | ---------------------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| `CREATE_ESCROW`       | Creating a new escrow                          | → `CREATED`                                        | `src/api/index.ts`                           |
| `FUND_ESCROW`         | Funding an existing escrow                     | `CREATED` → `FUNDED`                               | `src/api/index.ts`                           |
| `MARK_FIAT_PAID`      | Marking fiat as paid                           | `FUNDED` → `FIAT_PAID`                             | `src/api/index.ts`                           |
| `RELEASE_ESCROW`      | Releasing funds to the buyer                   | `FIAT_PAID` → `RELEASED`                           | `src/api/index.ts`                           |
| `CANCEL_ESCROW`       | Cancelling an escrow                           | Any state → `CANCELLED`                            | `src/api/index.ts`                           |
| `DISPUTE_ESCROW`      | Disputing an escrow                            | Any state → `DISPUTED`                             | `src/api/index.ts`                           |
| `OPEN_DISPUTE`        | Opening a dispute                              | → `OPENED`                                         | `src/api/index.ts`                           |
| `RESPOND_DISPUTE`     | Responding to a dispute                        | `OPENED` → `RESPONDED`                             | `src/api/index.ts`                           |
| `RESOLVE_DISPUTE`     | Resolving a dispute                            | `RESPONDED` → `RESOLVED`                           | `src/api/index.ts`                           |

## Frontend-Specific States

The frontend uses additional states to provide more granular status information to users. These states don't directly map to blockchain states but are derived from them to improve user experience.

### Frontend Trade Leg States

| State                     | Description                                          | Derived From                                      | Next States                                | Reference                                    |
| ------------------------- | ---------------------------------------------------- | ------------------------------------------------- | ------------------------------------------ | -------------------------------------------- |
| `AWAITING_FIAT_PAYMENT`   | Escrow is funded and waiting for buyer's fiat payment| `FUNDED` state                                    | `PENDING_CRYPTO_RELEASE`, `DISPUTED`       | `src/utils/tradeStates.ts`                   |
| `PENDING_CRYPTO_RELEASE`  | Fiat is paid and waiting for seller to release crypto| `FIAT_PAID` state                                 | `COMPLETED`, `DISPUTED`                    | `src/utils/tradeStates.ts`                   |
| `COMPLETED`               | Trade has been completed successfully                | `RELEASED` state                                  | (Terminal state)                           | `src/utils/tradeStates.ts`                   |

### Frontend State Mapping

This table shows how blockchain/API states map to frontend states:

| API/Blockchain State | Frontend State(s)                                | Reference                                                                 |
| -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------- |
| `CREATED`            | `CREATED`                                        | `src/utils/tradeStates.ts`, `src/components/Trade/TradeStatusDisplay`     |
| `FUNDED`             | `FUNDED`, `AWAITING_FIAT_PAYMENT`                | `src/utils/tradeStates.ts`, `src/components/Trade/TradeStatusDisplay`     |
| `FIAT_PAID`          | `FIAT_PAID`, `PENDING_CRYPTO_RELEASE`            | `src/utils/tradeStates.ts`, `src/components/Trade/TradeStatusDisplay`     |
| `RELEASED`           | `RELEASED`, `COMPLETED`                          | `src/utils/tradeStates.ts`, `src/components/Trade/TradeStatusDisplay`     |
| `CANCELLED`          | `CANCELLED`                                      | `src/utils/tradeStates.ts`, `src/components/Trade/TradeStatusDisplay`     |
| `DISPUTED`           | `DISPUTED`                                       | `src/utils/tradeStates.ts`, `src/components/Trade/TradeStatusDisplay`     |
| `RESOLVED`           | `RESOLVED`                                       | `src/utils/tradeStates.ts`, `src/components/Trade/TradeStatusDisplay`     |

### Frontend State Progression

```
CREATED → FUNDED → AWAITING_FIAT_PAYMENT → PENDING_CRYPTO_RELEASE → COMPLETED
     ↓         ↓                      ↓                        ↓
CANCELLED   DISPUTED ----------------→ RESOLVED
```

### UI Components Using Frontend States

| Component                                      | Usage                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `src/components/Trade/TradeStatusDisplay`      | Displays appropriate status icons and messages based on the current state                              |
| `src/components/Trade/TradeProgressBar.tsx`    | Shows trade progress with percentages: CREATED (0%), FUNDED (25%), AWAITING_FIAT_PAYMENT (50%), etc.   |
| `src/components/Trade/getAvailableActions.ts`  | Determines which actions are available to users based on the current state                             |
| `src/my/MyTradesPage.tsx`                      | Displays and filters trades based on their states                                                      |

### State-Specific User Messages

The frontend displays different messages to buyers and sellers based on the current trade state:

| State                     | Buyer Message                                   | Seller Message                                        | Reference                   |
| ------------------------- | ----------------------------------------------- | ----------------------------------------------------- | --------------------------- |
| `CREATED`                 | "Waiting for seller to create and fund escrow"  | "You need to create and fund the escrow"              | `src/utils/tradeStates.ts`  |
| `FUNDED`                  | "Escrow funded, pending your fiat payment"      | "Escrow funded, waiting for buyer to make fiat payment"| `src/utils/tradeStates.ts` |
| `AWAITING_FIAT_PAYMENT`   | "You need to make the fiat payment"             | "Waiting for buyer to make fiat payment"              | `src/utils/tradeStates.ts`  |
| `PENDING_CRYPTO_RELEASE`  | "Waiting for seller to release crypto"          | "Buyer has marked payment as sent. You need to release crypto."| `src/utils/tradeStates.ts` |
| `DISPUTED`                | "Trade is under dispute. Awaiting resolution."  | "Trade is under dispute. Awaiting resolution."        | `src/utils/tradeStates.ts`  |
| `COMPLETED`               | "Trade completed successfully"                  | "Trade completed successfully"                        | `src/utils/tradeStates.ts`  |
| `CANCELLED`               | "Trade was cancelled"                           | "Trade was cancelled"                                 | `src/utils/tradeStates.ts`  |
