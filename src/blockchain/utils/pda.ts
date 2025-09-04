/**
 * Program Derived Address (PDA) utilities for Solana
 */

import { PublicKey } from '@solana/web3.js';

export class PDADerivation {
  /**
   * Derive the main escrow PDA
   * Seeds: ["escrow", escrow_id, trade_id]
   */
  static deriveEscrowPDA(
    programId: PublicKey,
    escrowId: number,
    tradeId: number
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), Buffer.from(escrowId.toString()), Buffer.from(tradeId.toString())],
      programId
    );
  }

  /**
   * Derive the escrow token account PDA
   * Seeds: ["escrow_token", escrow_pda]
   */
  static deriveEscrowTokenPDA(programId: PublicKey, escrowPDA: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow_token'), escrowPDA.toBuffer()],
      programId
    );
  }

  /**
   * Derive the buyer bond account PDA
   * Seeds: ["buyer_bond", escrow_pda]
   */
  static deriveBuyerBondPDA(programId: PublicKey, escrowPDA: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('buyer_bond'), escrowPDA.toBuffer()],
      programId
    );
  }

  /**
   * Derive the seller bond account PDA
   * Seeds: ["seller_bond", escrow_pda]
   */
  static deriveSellerBondPDA(programId: PublicKey, escrowPDA: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('seller_bond'), escrowPDA.toBuffer()],
      programId
    );
  }

  /**
   * Derive all PDAs for an escrow in one call
   */
  static deriveAllEscrowPDAs(
    programId: PublicKey,
    escrowId: number,
    tradeId: number
  ): {
    escrow: [PublicKey, number];
    escrowToken: [PublicKey, number];
    buyerBond: [PublicKey, number];
    sellerBond: [PublicKey, number];
  } {
    const [escrowPDA] = this.deriveEscrowPDA(programId, escrowId, tradeId);
    const [escrowTokenPDA] = this.deriveEscrowTokenPDA(programId, escrowPDA);
    const [buyerBondPDA] = this.deriveBuyerBondPDA(programId, escrowPDA);
    const [sellerBondPDA] = this.deriveSellerBondPDA(programId, escrowPDA);

    return {
      escrow: [escrowPDA, 0], // We already have the bump from the first call
      escrowToken: [escrowTokenPDA, 0],
      buyerBond: [buyerBondPDA, 0],
      sellerBond: [sellerBondPDA, 0],
    };
  }

  /**
   * Validate that a PDA derivation is correct
   */
  static validatePDA(programId: PublicKey, seeds: Buffer[], expectedPDA: PublicKey): boolean {
    const [derivedPDA] = PublicKey.findProgramAddressSync(seeds, programId);
    return derivedPDA.equals(expectedPDA);
  }
}
