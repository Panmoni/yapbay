/**
 * Transaction utility functions for handling Solana vs EVM transaction recording
 */

import { NetworkType } from '../blockchain/types/index.js';
import { blockchainService } from '../services/blockchainService.js';

/**
 * Determines the network family based on the current blockchain service network
 */
export function getNetworkFamily(): 'evm' | 'solana' {
  const currentNetwork = blockchainService.getCurrentNetwork();
  return currentNetwork.type === NetworkType.SOLANA ? 'solana' : 'evm';
}

/**
 * Builds transaction data for recording, using appropriate fields based on network type
 */
export function buildTransactionData(params: {
  trade_id: number;
  escrow_id?: number;
  transactionHash?: string; // For EVM
  signature?: string; // For Solana
  transaction_type:
    | 'CREATE_ESCROW'
    | 'FUND_ESCROW'
    | 'MARK_FIAT_PAID'
    | 'RELEASE_ESCROW'
    | 'CANCEL_ESCROW'
    | 'DISPUTE_ESCROW'
    | 'OPEN_DISPUTE'
    | 'RESPOND_DISPUTE'
    | 'RESOLVE_DISPUTE'
    | 'OTHER';
  from_address: string;
  to_address?: string;
  amount?: string;
  token_type?: string;
  blockNumber?: number; // For EVM
  slot?: number; // For Solana
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  metadata?: Record<string, string>;
}) {
  const networkFamily = getNetworkFamily();

  const baseData = {
    trade_id: params.trade_id,
    escrow_id: params.escrow_id,
    transaction_type: params.transaction_type,
    from_address: params.from_address,
    to_address: params.to_address,
    amount: params.amount,
    token_type: params.token_type,
    status: params.status || 'SUCCESS',
    network_family: networkFamily,
    metadata: params.metadata,
  };

  if (networkFamily === 'solana') {
    return {
      ...baseData,
      signature: params.signature || params.transactionHash, // Fallback to transactionHash if signature not provided
      slot: params.slot || params.blockNumber, // Fallback to blockNumber if slot not provided
    };
  } else {
    return {
      ...baseData,
      transaction_hash: params.transactionHash || params.signature, // Fallback to signature if transactionHash not provided
      block_number: params.blockNumber || params.slot, // Fallback to slot if blockNumber not provided
    };
  }
}

/**
 * Extracts transaction identifier (hash or signature) from transaction result
 */
export function getTransactionIdentifier(txResult: {
  txHash?: string;
  signature?: string;
}): string {
  return txResult.signature || txResult.txHash || '';
}

/**
 * Extracts block/slot identifier from transaction result
 */
export function getBlockIdentifier(txResult: {
  blockNumber?: number;
  slot?: number;
}): number | undefined {
  return txResult.slot || txResult.blockNumber;
}
