/**
 * Defines the possible states for a trade leg (leg1 or leg2)
 * based on the API definition.
 */
export enum TradeLegState {
  /** Initial state when the trade record is created. */
  CREATED = 'CREATED',

  /** State after the seller has successfully deposited crypto into the escrow contract. */
  FUNDED = 'FUNDED',

  /** State after the escrow is funded and waiting for the buyer to make fiat payment. */
  AWAITING_FIAT_PAYMENT = 'AWAITING_FIAT_PAYMENT',

  /** State after the buyer has marked the fiat payment as completed and waiting for seller to release crypto. */
  PENDING_CRYPTO_RELEASE = 'PENDING_CRYPTO_RELEASE',

  /** State after the trade has been completed successfully. */
  COMPLETED = 'COMPLETED',

  /** State if the trade is cancelled before completion (e.g., timeout, mutual agreement). */
  CANCELLED = 'CANCELLED',

  /** State if either party initiates a dispute. */
  DISPUTED = 'DISPUTED',
}

/**
 * Defines the possible overall statuses for a trade.
 */
export enum TradeOverallStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

/**
 * Defines the possible states for an escrow record in the database,
 * mirroring the on-chain state where applicable.
 */
export enum EscrowDbState {
  CREATED = 'CREATED',
  FUNDED = 'FUNDED',
  RELEASED = 'RELEASED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

/**
 * Defines the possible statuses for a dispute record.
 */
export enum DisputeStatus {
  OPENED = 'OPENED',
  RESPONDED = 'RESPONDED',
  RESOLVED = 'RESOLVED',
  DEFAULTED = 'DEFAULTED',
}

/**
 * User-friendly messages for each trade state based on user role.
 * These messages are displayed to users in the UI to explain the current state
 * of their trade and what actions they may need to take.
 */
export const tradeStateMessages: Record<TradeLegState | string, Record<'buyer' | 'seller', string>> = {
  [TradeLegState.CREATED]: {
    buyer: "Waiting for seller to create and fund escrow",
    seller: "You need to create and fund the escrow"
  },
  [TradeLegState.FUNDED]: {
    buyer: "Escrow funded, pending your fiat payment",
    seller: "Escrow funded, waiting for buyer to make fiat payment"
  },
  [TradeLegState.AWAITING_FIAT_PAYMENT]: {
    buyer: "You need to make the fiat payment",
    seller: "Waiting for buyer to make fiat payment"
  },
  [TradeLegState.PENDING_CRYPTO_RELEASE]: {
    buyer: "Waiting for seller to release crypto",
    seller: "Buyer has marked payment as sent. You need to release crypto."
  },
  [TradeLegState.DISPUTED]: {
    buyer: "Trade is under dispute. Awaiting resolution.",
    seller: "Trade is under dispute. Awaiting resolution."
  },
  [TradeLegState.COMPLETED]: {
    buyer: "Trade completed successfully",
    seller: "Trade completed successfully"
  },
  [TradeLegState.CANCELLED]: {
    buyer: "Trade was cancelled",
    seller: "Trade was cancelled"
  }
};