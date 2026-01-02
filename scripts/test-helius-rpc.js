#!/usr/bin/env node

/**
 * Helius RPC Connection Test Script
 *
 * This script tests Helius RPC connections to Solana devnet over both HTTP and WebSocket (WSS).
 * It verifies connectivity, latency, and basic RPC operations.
 *
 * Usage:
 *   node scripts/test-helius-rpc.js [--http-only] [--wss-only] [--url <rpc-url>]
 *
 * Examples:
 *   node scripts/test-helius-rpc.js
 *   node scripts/test-helius-rpc.js --http-only
 *   node scripts/test-helius-rpc.js --wss-only
 *   node scripts/test-helius-rpc.js --url https://your-helius-url.com
 */

import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test wallet address (Solana devnet)
const TEST_WALLET = '11111111111111111111111111111111'; // System Program (always exists)
const USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Test HTTP RPC connection
 */
async function testHttpConnection(rpcUrl) {
  logSection('Testing HTTP RPC Connection');
  log(`RPC URL: ${rpcUrl}`, 'blue');

  const connection = new Connection(rpcUrl, 'confirmed');
  const results = {
    success: false,
    latency: null,
    version: null,
    slot: null,
    blockHeight: null,
    errors: [],
  };

  try {
    // Test 1: Get version (lightweight call)
    log('\n📡 Test 1: Get Version...', 'yellow');
    const startVersion = Date.now();
    const version = await connection.getVersion();
    const versionLatency = Date.now() - startVersion;
    results.version = version;
    log(`   ✅ Version: ${version['solana-core']}`, 'green');
    log(`   ⏱️  Latency: ${formatTime(versionLatency)}`, 'blue');
    results.latency = versionLatency;

    // Test 2: Get latest slot
    log('\n📡 Test 2: Get Latest Slot...', 'yellow');
    const startSlot = Date.now();
    const slot = await connection.getSlot();
    const slotLatency = Date.now() - startSlot;
    results.slot = slot;
    log(`   ✅ Slot: ${slot}`, 'green');
    log(`   ⏱️  Latency: ${formatTime(slotLatency)}`, 'blue');

    // Test 3: Get block height
    log('\n📡 Test 3: Get Block Height...', 'yellow');
    const startHeight = Date.now();
    const blockHeight = await connection.getBlockHeight();
    const heightLatency = Date.now() - startHeight;
    results.blockHeight = blockHeight;
    log(`   ✅ Block Height: ${blockHeight}`, 'green');
    log(`   ⏱️  Latency: ${formatTime(heightLatency)}`, 'blue');

    // Test 4: Get account info (test account lookup)
    log('\n📡 Test 4: Get Account Info...', 'yellow');
    const startAccount = Date.now();
    const accountInfo = await connection.getAccountInfo(new PublicKey(TEST_WALLET));
    const accountLatency = Date.now() - startAccount;
    log(`   ✅ Account found: ${accountInfo !== null}`, 'green');
    log(`   ⏱️  Latency: ${formatTime(accountLatency)}`, 'blue');

    // Test 5: Get token account balance (USDC mint)
    log('\n📡 Test 5: Get Token Account Balance...', 'yellow');
    try {
      const startToken = Date.now();
      // This will likely fail if the account doesn't exist, but tests the RPC call
      const tokenBalance = await connection.getTokenSupply(new PublicKey(USDC_MINT_DEVNET));
      const tokenLatency = Date.now() - startToken;
      log(`   ✅ Token Supply: ${tokenBalance.value.uiAmount}`, 'green');
      log(`   ⏱️  Latency: ${formatTime(tokenLatency)}`, 'blue');
    } catch (error) {
      log(`   ⚠️  Token balance check failed (expected if account doesn't exist): ${error.message}`, 'yellow');
    }

    results.success = true;
    log('\n✅ HTTP RPC Connection: SUCCESS', 'green');
  } catch (error) {
    results.success = false;
    results.errors.push(error.message);
    log(`\n❌ HTTP RPC Connection: FAILED`, 'red');
    log(`   Error: ${error.message}`, 'red');
    if (error.cause) {
      log(`   Cause: ${JSON.stringify(error.cause)}`, 'red');
    }
  }

  return results;
}

/**
 * Test WebSocket (WSS) RPC connection
 */
async function testWssConnection(rpcUrl) {
  logSection('Testing WebSocket (WSS) RPC Connection');

  // Convert HTTP URL to WebSocket URL
  let wssUrl = rpcUrl;
  if (wssUrl.startsWith('https://')) {
    wssUrl = wssUrl.replace('https://', 'wss://');
  } else if (wssUrl.startsWith('http://')) {
    wssUrl = wssUrl.replace('http://', 'ws://');
  } else if (!wssUrl.startsWith('wss://') && !wssUrl.startsWith('ws://')) {
    wssUrl = `wss://${wssUrl}`;
  }

  log(`WSS URL: ${wssUrl}`, 'blue');

  const connection = new Connection(rpcUrl, 'confirmed');
  const results = {
    success: false,
    subscriptionId: null,
    slotUpdates: 0,
    errors: [],
  };

  return new Promise((resolve) => {
    let subscriptionId = null;
    let slotUpdateCount = 0;
    const timeout = setTimeout(() => {
      if (subscriptionId !== null) {
        connection.removeSlotUpdateListener(subscriptionId);
      }
      if (slotUpdateCount > 0) {
        results.success = true;
        results.subscriptionId = subscriptionId;
        results.slotUpdates = slotUpdateCount;
        log('\n✅ WebSocket Connection: SUCCESS', 'green');
        log(`   Received ${slotUpdateCount} slot updates`, 'green');
      } else {
        results.success = false;
        results.errors.push('No slot updates received within timeout');
        log('\n⚠️  WebSocket Connection: TIMEOUT', 'yellow');
        log('   No slot updates received (this may be normal for devnet)', 'yellow');
      }
      resolve(results);
    }, 10000); // 10 second timeout

    try {
      log('\n📡 Subscribing to slot updates...', 'yellow');
      subscriptionId = connection.onSlotUpdate((slotInfo) => {
        slotUpdateCount++;
        if (slotUpdateCount === 1) {
          log(`   ✅ First slot update received: ${slotInfo.slot}`, 'green');
        }
        if (slotUpdateCount <= 3) {
          log(`   📊 Slot update #${slotUpdateCount}: ${slotInfo.slot}`, 'blue');
        }
      });

      log('   ⏳ Waiting for slot updates (10 second timeout)...', 'yellow');
    } catch (error) {
      clearTimeout(timeout);
      results.success = false;
      results.errors.push(error.message);
      log(`\n❌ WebSocket Connection: FAILED`, 'red');
      log(`   Error: ${error.message}`, 'red');
      resolve(results);
    }
  });
}

/**
 * Main test function
 */
async function main() {
  const args = process.argv.slice(2);
  const httpOnly = args.includes('--http-only');
  const wssOnly = args.includes('--wss-only');

  // Get RPC URL from args or environment
  let rpcUrl = process.env.VITE_SOLANA_RPC_URL_DEVNET;
  const urlIndex = args.indexOf('--url');
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    rpcUrl = args[urlIndex + 1];
  }

  if (!rpcUrl) {
    log('❌ No RPC URL provided', 'red');
    log('   Set VITE_SOLANA_RPC_URL_DEVNET environment variable or use --url flag', 'yellow');
    process.exit(1);
  }

  logSection('Helius RPC Connection Test');
  log(`Network: Solana Devnet`, 'blue');
  log(`RPC URL: ${rpcUrl}`, 'blue');

  const results = {
    http: null,
    wss: null,
  };

  // Test HTTP connection
  if (!wssOnly) {
    results.http = await testHttpConnection(rpcUrl);
  }

  // Test WebSocket connection
  if (!httpOnly) {
    results.wss = await testWssConnection(rpcUrl);
  }

  // Summary
  logSection('Test Summary');
  if (results.http) {
    if (results.http.success) {
      log('✅ HTTP RPC: PASSED', 'green');
      log(`   Average Latency: ${formatTime(results.http.latency)}`, 'blue');
      log(`   Latest Slot: ${results.http.slot}`, 'blue');
      log(`   Block Height: ${results.http.blockHeight}`, 'blue');
    } else {
      log('❌ HTTP RPC: FAILED', 'red');
      results.http.errors.forEach((error) => {
        log(`   Error: ${error}`, 'red');
      });
    }
  }

  if (results.wss) {
    if (results.wss.success) {
      log('✅ WebSocket RPC: PASSED', 'green');
      log(`   Slot Updates Received: ${results.wss.slotUpdates}`, 'blue');
    } else {
      log('⚠️  WebSocket RPC: TIMEOUT or FAILED', 'yellow');
      results.wss.errors.forEach((error) => {
        log(`   Error: ${error}`, 'yellow');
      });
    }
  }

  // Exit code
  const allPassed = (!results.http || results.http.success) && (!results.wss || results.wss.success);
  process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch((error) => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

