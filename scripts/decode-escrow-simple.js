#!/usr/bin/env node

/**
 * Simple Escrow Account Decoder Script
 *
 * This script queries a Solana escrow account and decodes its data into a human-readable format.
 * It manually decodes the account data based on the known structure from lib.rs.
 *
 * Usage:
 *   node scripts/decode-escrow-simple.js <escrow-address> [--url <rpc-url>]
 *
 * Example:
 *   node scripts/decode-escrow-simple.js 8rGJiZqS8e2AhnvmjBnssd9iBuNYSkfewGZR8JQwJMof --url devnet
 */

import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Escrow program ID
const PROGRAM_ID = '4PonUp1nPEzDPnRMPjTqufLT3f37QuBJGk1CVnsTXx7x';

// EscrowState enum values (from lib.rs)
const ESCROW_STATES = {
  0: 'Created',
  1: 'Funded',
  2: 'Released',
  3: 'Cancelled',
  4: 'Disputed',
  5: 'Resolved',
};

// Format timestamp to human readable
function formatTimestamp(timestamp) {
  if (timestamp === 0) return 'Not set';
  const date = new Date(timestamp * 1000);
  return `${date.toISOString()} (${timestamp})`;
}

// Format USDC amount (6 decimals)
function formatUSDC(amount) {
  return `${(amount / 1_000_000).toFixed(6)} USDC`;
}

// Format hash as hex string
function formatHash(hash) {
  if (!hash || hash.length === 0) return 'None';
  return Buffer.from(hash).toString('hex');
}

// Format Pubkey
function formatPubkey(pubkey) {
  if (!pubkey || pubkey.length === 0) return 'None';
  return new PublicKey(pubkey).toString();
}

// Manual decoder for escrow account data
function decodeEscrowData(data) {
  const buffer = Buffer.from(data);
  let offset = 8; // Skip 8-byte discriminator

  // Helper function to read u64 (little-endian)
  function readU64() {
    const value = buffer.readBigUInt64LE(offset);
    offset += 8;
    return Number(value);
  }

  // Helper function to read i64 (little-endian)
  function readI64() {
    const value = buffer.readBigInt64LE(offset);
    offset += 8;
    return Number(value);
  }

  // Helper function to read Pubkey (32 bytes)
  function readPubkey() {
    const pubkey = buffer.slice(offset, offset + 32);
    offset += 32;
    return pubkey;
  }

  // Helper function to read bool
  function readBool() {
    const value = buffer[offset];
    offset += 1;
    return value !== 0;
  }

  // Helper function to read Option<Pubkey>
  function readOptionPubkey() {
    const isSome = buffer[offset] !== 0;
    offset += 1;
    if (isSome) {
      return readPubkey();
    }
    return null;
  }

  // Helper function to read Option<i64>
  function readOptionI64() {
    const isSome = buffer[offset] !== 0;
    offset += 1;
    if (isSome) {
      return readI64();
    }
    return null;
  }

  // Helper function to read Option<[u8; 32]>
  function readOptionHash() {
    const isSome = buffer[offset] !== 0;
    offset += 1;
    if (isSome) {
      const hash = buffer.slice(offset, offset + 32);
      offset += 32;
      return hash;
    }
    return null;
  }

  try {
    const escrowData = {
      escrowId: readU64(),
      tradeId: readU64(),
      seller: readPubkey(),
      buyer: readPubkey(),
      arbitrator: readPubkey(),
      amount: readU64(),
      fee: readU64(),
      depositDeadline: readI64(),
      fiatDeadline: readI64(),
      state: buffer[offset++], // u8 enum
      sequential: readBool(),
      sequentialEscrowAddress: readOptionPubkey(),
      fiatPaid: readBool(),
      counter: readU64(),
      disputeInitiator: readOptionPubkey(),
      disputeInitiatedTime: readOptionI64(),
      disputeEvidenceHashBuyer: readOptionHash(),
      disputeEvidenceHashSeller: readOptionHash(),
      disputeResolutionHash: readOptionHash(),
      trackedBalance: readU64(),
    };

    return escrowData;
  } catch (error) {
    console.error('❌ Failed to decode escrow data:', error.message);
    return null;
  }
}

// Display escrow information in a formatted way
function displayEscrowInfo(escrowData, accountInfo) {
  console.log('\n🔍 ESCROW ACCOUNT ANALYSIS');
  console.log('═'.repeat(60));

  // Basic account info
  console.log('\n📊 ACCOUNT INFO:');
  console.log(`  Owner: ${accountInfo.owner.toString()}`);
  console.log(`  Lamports: ${accountInfo.lamports.toLocaleString()}`);
  console.log(`  Space: ${accountInfo.space} bytes`);
  console.log(`  Executable: ${accountInfo.executable}`);
  console.log(`  Rent Epoch: ${accountInfo.rentEpoch}`);

  // Escrow details
  console.log('\n🏦 ESCROW DETAILS:');
  console.log(`  Escrow ID: ${escrowData.escrowId.toLocaleString()}`);
  console.log(`  Trade ID: ${escrowData.tradeId.toLocaleString()}`);
  console.log(`  State: ${ESCROW_STATES[escrowData.state] || `Unknown (${escrowData.state})`}`);
  console.log(`  Counter: ${escrowData.counter}`);

  // Parties
  console.log('\n👥 PARTIES:');
  console.log(`  Seller: ${formatPubkey(escrowData.seller)}`);
  console.log(`  Buyer: ${formatPubkey(escrowData.buyer)}`);
  console.log(`  Arbitrator: ${formatPubkey(escrowData.arbitrator)}`);

  // Financial details
  console.log('\n💰 FINANCIAL DETAILS:');
  console.log(`  Amount: ${formatUSDC(escrowData.amount)}`);
  console.log(`  Fee: ${formatUSDC(escrowData.fee)}`);
  console.log(`  Total: ${formatUSDC(escrowData.amount + escrowData.fee)}`);
  console.log(`  Tracked Balance: ${formatUSDC(escrowData.trackedBalance)}`);

  // Deadlines
  console.log('\n⏰ DEADLINES:');
  console.log(`  Deposit Deadline: ${formatTimestamp(escrowData.depositDeadline)}`);
  console.log(`  Fiat Deadline: ${formatTimestamp(escrowData.fiatDeadline)}`);

  // Trade details
  console.log('\n🔄 TRADE DETAILS:');
  console.log(`  Sequential: ${escrowData.sequential ? 'Yes' : 'No'}`);
  console.log(`  Sequential Address: ${formatPubkey(escrowData.sequentialEscrowAddress)}`);
  console.log(`  Fiat Paid: ${escrowData.fiatPaid ? 'Yes' : 'No'}`);

  // Dispute information
  if (escrowData.disputeInitiator || escrowData.disputeInitiatedTime) {
    console.log('\n⚖️  DISPUTE INFORMATION:');
    console.log(`  Initiator: ${formatPubkey(escrowData.disputeInitiator)}`);
    console.log(`  Initiated Time: ${formatTimestamp(escrowData.disputeInitiatedTime)}`);
    console.log(`  Buyer Evidence Hash: ${formatHash(escrowData.disputeEvidenceHashBuyer)}`);
    console.log(`  Seller Evidence Hash: ${formatHash(escrowData.disputeEvidenceHashSeller)}`);
    console.log(`  Resolution Hash: ${formatHash(escrowData.disputeResolutionHash)}`);
  }

  // Status summary
  console.log('\n📋 STATUS SUMMARY:');
  const currentTime = Math.floor(Date.now() / 1000);
  const depositExpired = escrowData.depositDeadline > 0 && currentTime > escrowData.depositDeadline;
  const fiatExpired = escrowData.fiatDeadline > 0 && currentTime > escrowData.fiatDeadline;

  console.log(`  Current Time: ${formatTimestamp(currentTime)}`);
  console.log(`  Deposit Expired: ${depositExpired ? 'Yes' : 'No'}`);
  console.log(`  Fiat Expired: ${fiatExpired ? 'Yes' : 'No'}`);

  // State-specific information
  const state = ESCROW_STATES[escrowData.state];
  console.log(`\n🎯 STATE ANALYSIS (${state}):`);

  switch (state) {
    case 'Created':
      console.log('  • Escrow has been created but not yet funded');
      console.log('  • Seller needs to fund the escrow before deposit deadline');
      break;
    case 'Funded':
      console.log('  • Escrow has been funded and is ready for trade');
      console.log('  • Buyer can mark fiat payment as completed');
      console.log('  • Seller can release funds after fiat is marked paid');
      break;
    case 'Released':
      console.log('  • Escrow has been successfully completed');
      console.log('  • Funds have been released to buyer');
      break;
    case 'Cancelled':
      console.log('  • Escrow has been cancelled');
      console.log('  • Funds returned to seller (if funded)');
      break;
    case 'Disputed':
      console.log('  • Escrow is in dispute resolution');
      console.log('  • Arbitrator needs to resolve the dispute');
      break;
    case 'Resolved':
      console.log('  • Dispute has been resolved');
      console.log('  • Final decision has been made');
      break;
    default:
      console.log('  • Unknown state');
  }

  // Raw data inspection
  console.log('\n🔍 RAW DATA INSPECTION:');
  console.log(`  Data Length: ${accountInfo.data.length} bytes`);
  console.log(`  Discriminator: ${Buffer.from(accountInfo.data.slice(0, 8)).toString('hex')}`);

  // Debug: Show raw bytes for tracked_balance (should be last 8 bytes)
  const trackedBalanceBytes = accountInfo.data.slice(-8);
  console.log(`  Tracked Balance Raw Bytes: ${trackedBalanceBytes.toString('hex')}`);
  console.log(`  Tracked Balance as U64: ${Buffer.from(trackedBalanceBytes).readBigUInt64LE(0)}`);
  console.log(`  Expected: 10100000 (10.1 USDC)`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/decode-escrow-simple.js <escrow-address> [--url <rpc-url>]');
    console.log(
      'Example: node scripts/decode-escrow-simple.js 8rGJiZqS8e2AhnvmjBnssd9iBuNYSkfewGZR8JQwJMof --url devnet'
    );
    process.exit(1);
  }

  const escrowAddress = args[0];
  let rpcUrl = process.env.VITE_SOLANA_RPC_URL_DEVNET || 'https://api.devnet.solana.com'; // default to env or devnet

  // Parse URL argument
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    const urlArg = args[urlIndex + 1];
    // Handle common network shortcuts
    if (urlArg === 'devnet') {
      rpcUrl = process.env.VITE_SOLANA_RPC_URL_DEVNET || 'https://api.devnet.solana.com';
    } else if (urlArg === 'mainnet') {
      rpcUrl = process.env.VITE_SOLANA_RPC_URL_MAINNET || 'https://api.mainnet-beta.solana.com';
    } else if (urlArg === 'testnet') {
      rpcUrl = 'https://api.testnet.solana.com';
    } else if (urlArg === 'localnet') {
      rpcUrl = 'http://127.0.0.1:8899';
    } else {
      rpcUrl = urlArg;
    }
  }

  console.log('🔍 Decoding Escrow Account (Simple Version)');
  console.log(`📍 Address: ${escrowAddress}`);
  console.log(`🌐 RPC URL: ${rpcUrl}`);

  try {
    // Validate escrow address
    new PublicKey(escrowAddress);
  } catch (error) {
    console.error('❌ Invalid escrow address:', error.message);
    process.exit(1);
  }

  // Connect to Solana
  console.log('🔗 Connecting to Solana...');
  const connection = new Connection(rpcUrl, 'confirmed');

  // Get account info
  console.log('📥 Fetching account data...');
  const accountInfo = await connection.getAccountInfo(new PublicKey(escrowAddress));

  if (!accountInfo) {
    console.error('❌ Account not found or has no data');
    process.exit(1);
  }

  // Verify account owner
  if (!accountInfo.owner.equals(new PublicKey(PROGRAM_ID))) {
    console.error(
      `❌ Account is not owned by the escrow program. Owner: ${accountInfo.owner.toString()}`
    );
    process.exit(1);
  }

  // Decode account data
  console.log('🔓 Decoding account data...');
  const escrowData = decodeEscrowData(accountInfo.data);

  if (!escrowData) {
    console.error('❌ Failed to decode escrow data');
    process.exit(1);
  }

  // Display information
  displayEscrowInfo(escrowData, accountInfo);

  console.log('\n✅ Decoding complete!');
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

export { decodeEscrowData, displayEscrowInfo, ESCROW_STATES };
