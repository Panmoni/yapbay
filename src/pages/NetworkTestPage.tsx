/**
 * Network Registry Test Page
 * Access this page in your browser to test the network registry with real environment variables
 */

import React, { useEffect, useState } from 'react';
import { networkRegistry, NetworkType, NetworkConfig } from '../blockchain/index.js';
import { BlockchainServiceTest } from '../components/BlockchainServiceTest.js';
import { EscrowTestWorkflow } from '../components/EscrowTestWorkflow.js';
import { UnifiedBlockchainService } from '../services/blockchainService.js';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export const NetworkTestPage: React.FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [defaultNetwork, setDefaultNetwork] = useState<NetworkConfig | null>(null);
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [blockchainService, setBlockchainService] = useState<UnifiedBlockchainService | null>(null);

  useEffect(() => {
    // Get all networks
    const allNetworks = networkRegistry.getAllIds().map(id => networkRegistry.get(id)!);
    setNetworks(allNetworks);

    // Get default network
    try {
      const defaultNet = networkRegistry.getDefault();
      setDefaultNetwork(defaultNet);
    } catch (error) {
      console.error('Error getting default network:', error);
    }

    // Initialize blockchain service
    try {
      const service = new UnifiedBlockchainService();
      setBlockchainService(service);
    } catch (error) {
      console.error('Error initializing blockchain service:', error);
    }

    // Get environment variables for debugging
    setEnvVars({
      VITE_DEFAULT_NETWORK: import.meta.env.VITE_DEFAULT_NETWORK || 'not set',
      VITE_SOLANA_RPC_URL_DEVNET: import.meta.env.VITE_SOLANA_RPC_URL_DEVNET || 'not set',
      VITE_SOLANA_PROGRAM_ID_DEVNET: import.meta.env.VITE_SOLANA_PROGRAM_ID_DEVNET || 'not set',
      VITE_SOLANA_USDC_MINT_DEVNET: import.meta.env.VITE_SOLANA_USDC_MINT_DEVNET || 'not set',
      VITE_SOLANA_ARBITRATOR_ADDRESS: import.meta.env.VITE_SOLANA_ARBITRATOR_ADDRESS || 'not set',
    });
  }, []);

  // Update blockchain service with wallet address and wallet object when wallet changes
  useEffect(() => {
    if (blockchainService && primaryWallet?.address) {
      blockchainService.setWalletAddress(primaryWallet.address);
      blockchainService.updateWallet(primaryWallet);
      console.log('Updated blockchain service with wallet address:', primaryWallet.address);
    } else if (blockchainService && !primaryWallet?.address) {
      blockchainService.setWalletAddress(null);
      blockchainService.updateWallet(null);
      console.log('Cleared wallet address from blockchain service');
    }
  }, [blockchainService, primaryWallet]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Network Registry Test</h1>

        {/* Environment Variables Debug */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">🔧 Environment Variables</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="bg-white p-3 rounded border">
                <p className="font-mono text-sm text-gray-600">{key}</p>
                <p className="font-mono text-sm text-gray-900 break-all">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Registry Status */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Registry Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{networkRegistry.size()}</p>
              <p className="text-sm text-gray-600">Total Networks</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                {networkRegistry.getEnabled().length}
              </p>
              <p className="text-sm text-gray-600">Enabled Networks</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {networkRegistry.getByType(NetworkType.SOLANA).length}
              </p>
              <p className="text-sm text-gray-600">Solana Networks</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">
                {networkRegistry.getByType(NetworkType.EVM).length}
              </p>
              <p className="text-sm text-gray-600">EVM Networks</p>
            </div>
          </div>
        </div>

        {/* Default Network */}
        {defaultNetwork && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎯 Default Network</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">ID</p>
                  <p className="font-mono text-lg font-semibold">{defaultNetwork.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-lg font-semibold">{defaultNetwork.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="text-lg font-semibold">{defaultNetwork.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Testnet</p>
                  <p className="text-lg font-semibold">{defaultNetwork.isTestnet ? 'Yes' : 'No'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">RPC URL</p>
                  <p className="font-mono text-sm break-all">{defaultNetwork.rpcUrl}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">Block Explorer</p>
                  <p className="font-mono text-sm break-all">{defaultNetwork.blockExplorerUrl}</p>
                </div>
                {defaultNetwork.programId && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Program ID</p>
                    <p className="font-mono text-sm break-all">{defaultNetwork.programId}</p>
                  </div>
                )}
                {defaultNetwork.usdcMint && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">USDC Mint</p>
                    <p className="font-mono text-sm break-all">{defaultNetwork.usdcMint}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All Networks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔗 All Networks</h2>
          <div className="space-y-4">
            {networks.map(network => (
              <div key={network.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{network.name}</h3>
                    <p className="text-sm text-gray-600 font-mono">{network.id}</p>
                  </div>
                  <div className="flex space-x-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        network.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {network.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    {network.isTestnet && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Testnet
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        network.type === NetworkType.SOLANA
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {network.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">RPC URL</p>
                    <p className="font-mono break-all">{network.rpcUrl}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Block Explorer</p>
                    <p className="font-mono break-all">{network.blockExplorerUrl}</p>
                  </div>
                  {network.programId && (
                    <div>
                      <p className="text-gray-600">Program ID</p>
                      <p className="font-mono break-all">{network.programId}</p>
                    </div>
                  )}
                  {network.usdcMint && (
                    <div>
                      <p className="text-gray-600">USDC Mint</p>
                      <p className="font-mono break-all">{network.usdcMint}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Blockchain Service Test */}
      <div className="mt-8">
        <BlockchainServiceTest />
      </div>

      {/* Escrow Lifecycle Testing */}
      {blockchainService && (
        <div className="mt-8">
          <EscrowTestWorkflow blockchainService={blockchainService} />
        </div>
      )}
    </div>
  );
};
