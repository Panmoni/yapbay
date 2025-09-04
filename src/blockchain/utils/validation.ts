/**
 * Input validation utilities for blockchain operations
 */

import { PublicKey } from '@solana/web3.js';

export class ValidationUtils {
  /**
   * Validate Solana address format
   */
  static isValidSolanaAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate EVM address format (basic check)
   */
  static isValidEVMAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate amount is positive and within limits
   */
  static isValidAmount(amount: string, maxAmount: number = 100): boolean {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= maxAmount;
  }

  /**
   * Validate deadline is in the future
   */
  static isValidDeadline(deadline: number): boolean {
    return deadline > Date.now() / 1000;
  }

  /**
   * Validate escrow ID is positive
   */
  static isValidEscrowId(escrowId: number): boolean {
    return Number.isInteger(escrowId) && escrowId > 0;
  }

  /**
   * Validate trade ID is positive
   */
  static isValidTradeId(tradeId: number): boolean {
    return Number.isInteger(tradeId) && tradeId > 0;
  }
}
