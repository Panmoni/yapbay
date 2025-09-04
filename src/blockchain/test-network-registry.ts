/**
 * Test script for Network Registry functionality
 * Run with: npm run dev (in browser console) or create a test component
 */

import { networkRegistry, NetworkType, initializeNetworks } from './index.js';

console.log('🧪 Testing Network Registry System...\n');

// Test 1: Check if networks are registered
console.log('📊 Network Registry Status:');
console.log(`Total networks: ${networkRegistry.size()}`);
console.log(`All network IDs: ${networkRegistry.getAllIds().join(', ')}`);

// Test 2: Get enabled networks
const enabledNetworks = networkRegistry.getEnabled();
console.log(`\n✅ Enabled networks: ${enabledNetworks.length}`);
enabledNetworks.forEach(network => {
  console.log(`  - ${network.id} (${network.type}): ${network.name}`);
});

// Test 3: Get networks by type
const solanaNetworks = networkRegistry.getByType(NetworkType.SOLANA);
console.log(`\n🔗 Solana networks: ${solanaNetworks.length}`);
solanaNetworks.forEach(network => {
  console.log(`  - ${network.id}: ${network.name} (enabled: ${network.enabled})`);
});

const evmNetworks = networkRegistry.getByType(NetworkType.EVM);
console.log(`\n⛓️ EVM networks: ${evmNetworks.length}`);
evmNetworks.forEach(network => {
  console.log(`  - ${network.id}: ${network.name} (enabled: ${network.enabled})`);
});

// Test 4: Get default network
try {
  const defaultNetwork = networkRegistry.getDefault();
  console.log(`\n🎯 Default network: ${defaultNetwork.id} (${defaultNetwork.type})`);
  console.log(`   RPC URL: ${defaultNetwork.rpcUrl}`);
  console.log(`   Block Explorer: ${defaultNetwork.blockExplorerUrl}`);
} catch (error) {
  console.error(`\n❌ Error getting default network: ${error}`);
}

// Test 5: Test network lookup
const testNetworkId = 'solana-devnet';
if (networkRegistry.has(testNetworkId)) {
  const network = networkRegistry.get(testNetworkId);
  console.log(`\n🔍 Network lookup test: ${testNetworkId}`);
  console.log(`   Name: ${network?.name}`);
  console.log(`   Type: ${network?.type}`);
  console.log(`   Program ID: ${network?.programId}`);
} else {
  console.log(`\n❌ Network not found: ${testNetworkId}`);
}

console.log('\n✅ Network Registry test completed!');

// Export for use in browser console
export { networkRegistry, NetworkType };
