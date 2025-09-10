#!/usr/bin/env node

/**
 * Escrow Account Decoder Script
 *
 * This script queries a Solana escrow account and decodes its data into a human-readable format.
 * It uses the Anchor program's IDL to properly deserialize the account data.
 *
 * Usage:
 *   node scripts/decode-escrow.js <escrow-address> [--url <rpc-url>]
 *
 * Example:
 *   node scripts/decode-escrow.js 8rGJiZqS8e2AhnvmjBnssd9iBuNYSkfewGZR8JQwJMof --url devnet
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { BorshCoder } from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Load IDL
function loadIDL() {
  const idlPath = path.join(__dirname, '..', 'src', 'contracts', 'solana', 'idl.json');
  try {
    const idlData = fs.readFileSync(idlPath, 'utf8');
    return JSON.parse(idlData);
  } catch (error) {
    console.error('❌ Failed to load IDL:', error.message);
    process.exit(1);
  }
}

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
  if (!hash) return 'None';
  return Buffer.from(hash).toString('hex');
}

// Format Pubkey
function formatPubkey(pubkey) {
  if (!pubkey) return 'None';
  return pubkey.toString();
}

// Decode escrow account data
function decodeEscrowData(accountData, idl) {
  try {
    const coder = new BorshCoder(idl);
    const decoded = coder.accounts.decode('Escrow', accountData);
    return decoded;
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
}

// Main function
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/decode-escrow.js <escrow-address> [--url <rpc-url>]');
    console.log(
      'Example: node scripts/decode-escrow.js 8rGJiZqS8e2AhnvmjBnssd9iBuNYSkfewGZR8JQwJMof --url devnet'
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

  console.log('🔍 Decoding Escrow Account');
  console.log(`📍 Address: ${escrowAddress}`);
  console.log(`🌐 RPC URL: ${rpcUrl}`);

  try {
    // Validate escrow address
    new PublicKey(escrowAddress);
  } catch (error) {
    console.error('❌ Invalid escrow address:', error.message);
    process.exit(1);
  }

  // Load IDL
  console.log('\n📚 Loading IDL...');
  const idl = loadIDL();

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
  const escrowData = decodeEscrowData(accountInfo.data, idl);

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
