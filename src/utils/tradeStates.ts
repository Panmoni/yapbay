/**
 * Defines the possible states for a trade leg (leg1 or leg2)
 * based on the database schema.
 */
export enum TradeLegState {
  /** Initial state when the trade record is created. */
  CREATED = 'CREATED',

  /** State after the seller has successfully deposited crypto into the escrow contract. */
  FUNDED = 'FUNDED',

  /** State after the buyer has marked the fiat payment as completed. */
  FIAT_PAID = 'FIAT_PAID',

  /** State after the seller has released the crypto from escrow to the buyer. */
  RELEASED = 'RELEASED',

  /** State if the trade is cancelled before completion (e.g., timeout, mutual agreement). */
  CANCELLED = 'CANCELLED',

  /** State if either party initiates a dispute. */
  DISPUTED = 'DISPUTED',

  /** State after a dispute has been resolved by the arbitrator. */
  RESOLVED = 'RESOLVED',
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
  RESOLVED = 'RESOLVED',
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