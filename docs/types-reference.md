# YapBay Types Reference

This document provides a comprehensive reference of the types used throughout the YapBay application.

## Table of Contents

- [Core Data Types](#core-data-types)
  - [Account](#account)
  - [Offer](#offer)
  - [Trade](#trade)
  - [Escrow](#escrow)
- [State Enums](#state-enums)
  - [TradeLegState](#tradelegstate)
  - [TradeOverallStatus](#tradeoverallstatus)
  - [EscrowState](#escrowstate)
  - [EscrowDbState](#escrowdbstate)
  - [DisputeStatus](#disputestatus)
- [Blockchain Types](#blockchain-types)
  - [EscrowDetails](#escrowdetails)
- [Hook Return Types](#hook-return-types)
  - [useTradeDetails](#usetradedetails)
  - [useTradeActions](#usetradeactions)
  - [useTradeParticipants](#usertradeparticipants)
  - [useUserRole](#useruserrole)
  - [useTradeUpdates](#usetradeupdate)
  - [useEscrowDetails](#useescrowdetails)
- [Component Props](#component-props)
  - [TradeStatusDisplay](#tradestatusdisplay)
  - [TradeStatusCard](#tradestatuscard)
- [Service Types](#service-types)
  - [TradeService](#tradeservice)
  - [BlockchainService](#blockchainservice)

## Core Data Types

### Account

Represents a user account in the system.

```typescript
interface Account {
  id: number;
  wallet_address: string;
  username: string;
  email: string;
  telegram_username?: string;
  telegram_id?: number;
  profile_photo_url?: string;
  phone_country_code?: string;
  phone_number?: string;
  available_from?: string;
  available_to?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}
```

### Offer

Represents a trading offer created by a user.

```typescript
interface Offer {
  id: number;
  creator_account_id: number;
  offer_type: 'BUY' | 'SELL';
  token: string;
  min_amount: number;
  max_amount: number;
  total_available_amount: number;
  rate_adjustment: number;
  terms: string;
  escrow_deposit_time_limit: { minutes: number } | string;
  fiat_payment_time_limit: { minutes: number } | string;
  fiat_currency: string;
  created_at: string;
  updated_at: string;
}
```

### Trade

Represents a trade between two users.

```typescript
interface Trade {
  id: number;
  leg1_offer_id: number;
  leg2_offer_id?: number | null;
  overall_status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  from_fiat_currency: string;
  destination_fiat_currency: string;
  from_bank?: string | null;
  destination_bank?: string | null;
  created_at: string;
  updated_at: string;

  leg1_state?:
    | 'CREATED'
    | 'AWAITING_FIAT_PAYMENT'
    | 'PENDING_CRYPTO_RELEASE'
    | 'DISPUTED'
    | 'COMPLETED'
    | 'CANCELLED';
  leg1_seller_account_id?: number;
  leg1_buyer_account_id?: number | null;
  leg1_crypto_token?: string;
  leg1_crypto_amount?: string;
  leg1_fiat_amount?: string | null;
  leg1_fiat_currency?: string;
  leg1_escrow_address?: string | null;
  leg1_created_at?: string;
  leg1_escrow_deposit_deadline?: string | null;
  leg1_fiat_payment_deadline?: string | null;
  leg1_fiat_paid_at?: string | null;
  leg1_released_at?: string | null;
  leg1_cancelled_at?: string | null;
  leg1_cancelled_by?: string | null;
  leg1_dispute_id?: number | null;
  leg1_escrow_onchain_id?: string | null;

  leg2_state?: string | null;
  leg2_seller_account_id?: number | null;
  leg2_buyer_account_id?: number | null;
  leg2_crypto_token?: string | null;
  leg2_crypto_amount?: string | null;
  leg2_fiat_amount?: string | null;
  leg2_fiat_currency?: string | null;
  leg2_escrow_address?: string | null;
  leg2_created_at?: string | null;
  leg2_escrow_deposit_deadline?: string | null;
  leg2_fiat_payment_deadline?: string | null;
  leg2_fiat_paid_at?: string | null;
  leg2_released_at?: string | null;
  leg2_cancelled_at?: string | null;
  leg2_cancelled_by?: string | null;
  leg2_dispute_id?: number | null;
  leg2_escrow_onchain_id?: string | null;
}
```

### Escrow

Represents an escrow record in the database.

```typescript
interface Escrow {
  trade_id: number;
  escrow_address: string;
  seller_address: string;
  buyer_address: string;
  token_type: string;
  amount: string;
  deposit_timestamp: string | null;
  status: 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED' | 'DISPUTED';
  dispute_id: number | null;
  sequential: boolean;
  sequential_escrow_address: string | null;
  created_at: string;
  updated_at: string;
}
```

## State Enums

### TradeLegState

Defines the possible states for a trade leg.

```typescript
enum TradeLegState {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  AWAITING_FIAT_PAYMENT = 'AWAITING_FIAT_PAYMENT',
  PENDING_CRYPTO_RELEASE = 'PENDING_CRYPTO_RELEASE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}
```

### TradeOverallStatus

Defines the possible overall statuses for a trade.

```typescript
enum TradeOverallStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}
```

### EscrowState

Defines the possible states for an escrow on the blockchain.

```typescript
enum EscrowState {
  CREATED = 0,
  FUNDED = 1,
  FIAT_PAID = 2,
  RELEASED = 3,
  CANCELLED = 4,
  DISPUTED = 5,
  RESOLVED = 6,
}
```

### EscrowDbState

Defines the possible states for an escrow record in the database.

```typescript
enum EscrowDbState {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  RELEASED = 'RELEASED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}
```

### DisputeStatus

Defines the possible statuses for a dispute record.

```typescript
enum DisputeStatus {
  OPENED = 'OPENED',
  RESPONDED = 'RESPONDED',
  RESOLVED = 'RESOLVED',
  DEFAULTED = 'DEFAULTED',
}
```

## Blockchain Types

### EscrowDetails

Represents the details of an escrow on the blockchain.

```typescript
interface EscrowDetails {
  escrow_id: bigint;
  trade_id: bigint;
  seller: string;
  buyer: string;
  arbitrator: string;
  amount: bigint;
  deposit_deadline: bigint;
  fiat_deadline: bigint;
  state: EscrowState;
  sequential: boolean;
  sequential_escrow_address: string;
  fiat_paid: boolean;
  counter: bigint;
  dispute_initiator: string;
  dispute_bond_buyer: bigint;
  dispute_bond_seller: bigint;
  dispute_timestamp: bigint;
  dispute_evidence_hash: string;
}
```

## Hook Return Types

### useTradeDetails

```typescript
interface UseTradeDetailsResult {
  trade: Trade | null;
  offer: Offer | null;
  creator: Account | null;
  buyerAccount: Account | null;
  sellerAccount: Account | null;
  loading: boolean;
  setTrade: React.Dispatch<React.SetStateAction<Trade | null>>;
}
```

### useTradeActions

```typescript
interface UseTradeActionsProps {
  trade: Trade | null;
  primaryWallet: {
    address?: string;
    getWalletClient?: () => Promise<unknown>;
    getPublicClient?: () => Promise<unknown>;
  };
  counterparty: Account | null;
  userRole: string;
  onRefresh: () => void;
}

interface UseTradeActionsResult {
  createEscrow: () => Promise<void>;
  markFiatPaid: () => Promise<void>;
  releaseCrypto: () => Promise<void>;
  disputeTrade: () => Promise<void>;
  cancelTrade: () => Promise<void>;
  actionLoading: boolean;
}
```

### useTradeParticipants

```typescript
interface UseTradeParticipantsResult {
  userRole: 'buyer' | 'seller';
  currentAccount: Account | null;
  counterparty: Account | null;
  isLoading: boolean;
}
```

### useUserRole

```typescript
interface UseUserRoleResult {
  userRole: 'buyer' | 'seller';
  currentAccount: Account | null;
  isLoading: boolean;
  getCounterpartyRole: () => 'buyer' | 'seller';
}
```

### useTradeUpdates

```typescript
interface UseTradeUpdatesResult {
  trade: Trade | null;
  error: Error | null;
  isConnected: boolean;
}
```

### useEscrowDetails

```typescript
interface UseEscrowDetailsResult {
  escrowDetails: EscrowDetails | null;
  loading: boolean;
  error: Error | null;
  balance: string;
  lastUpdated: Date | null;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}
```

## Component Props

### TradeStatusDisplay

```typescript
interface TradeStatusDisplayProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  onCreateEscrow?: () => void;
  onFundEscrow?: () => void;
  onMarkFiatPaid?: () => void;
  onReleaseCrypto?: () => void;
  onDisputeTrade?: () => void;
  onCancelTrade?: () => void;
  loading?: boolean;
  escrowDetails?: { escrow_id: bigint; amount: bigint; state: bigint };
  escrowLoading?: boolean;
  escrowError?: Error | null;
  balance?: string;
  refreshEscrow?: () => Promise<void>;
}
```

### TradeStatusCard

```typescript
interface TradeStatusCardProps {
  trade: Trade;
  userRole: 'buyer' | 'seller';
  actions: {
    createEscrow: () => Promise<void>;
    markFiatPaid: () => Promise<void>;
    releaseCrypto: () => Promise<void>;
    disputeTrade: () => Promise<void>;
    cancelTrade: () => Promise<void>;
  };
  actionLoading: boolean;
  escrowDetails?: { escrow_id: bigint; amount: bigint; state: bigint };
  escrowLoading?: boolean;
  escrowError?: Error | null;
  balance?: string;
  refreshEscrow?: () => Promise<void>;
}
```

## Service Types

### TradeService

#### StartTradeParams

```typescript
interface StartTradeParams {
  offerId: number;
  amount?: string;
  fiatAmount?: number;
  offer: Offer;
  primaryWallet: { address?: string } | null;
  onSuccess: (tradeId: number) => void;
  onError: (error: Error) => void;
}
```

#### CreateEscrowParams

```typescript
interface CreateEscrowParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
    getWalletClient: () => Promise<unknown>;
    getPublicClient: () => Promise<unknown>;
  };
  buyerAddress: string;
  sellerAddress: string;
}
```

#### MarkFiatPaidParams

```typescript
interface MarkFiatPaidParams {
  trade: Trade;
  primaryWallet: {
    address?: string;
    getWalletClient: () => Promise<unknown>;
    getPublicClient: () => Promise<unknown>;
  };
}
```

### BlockchainService

#### CreateEscrowParams

```typescript
interface CreateEscrowParams {
  tradeId: number;
  buyer: string;
  amount: number;
  sequential?: boolean;
  sequentialEscrowAddress?: string;
  arbitrator?: string;
}
```

#### CreateEscrowResult

```typescript
interface CreateEscrowResult {
  escrowId: string;
  txHash: string;
  blockNumber: bigint;
}
```
