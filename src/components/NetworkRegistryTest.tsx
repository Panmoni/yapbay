/**
 * Test component for Network Registry functionality
 * Add this to your app temporarily to test the network registry
 */

import React, { useEffect, useState } from 'react';
import { networkRegistry, NetworkType, NetworkConfig } from '../blockchain/index.js';

export const NetworkRegistryTest: React.FC = () => {
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [defaultNetwork, setDefaultNetwork] = useState<NetworkConfig | null>(null);

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
  }, []);

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🧪 Network Registry Test</h2>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">📊 Registry Status</h3>
        <p>
          Total networks: <strong>{networkRegistry.size()}</strong>
        </p>
        <p>
          Enabled networks: <strong>{networkRegistry.getEnabled().length}</strong>
        </p>
      </div>

      {defaultNetwork && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">🎯 Default Network</h3>
          <div className="bg-white p-3 rounded border">
            <p>
              <strong>ID:</strong> {defaultNetwork.id}
            </p>
            <p>
              <strong>Name:</strong> {defaultNetwork.name}
            </p>
            <p>
              <strong>Type:</strong> {defaultNetwork.type}
            </p>
            <p>
              <strong>RPC URL:</strong> {defaultNetwork.rpcUrl}
            </p>
            <p>
              <strong>Block Explorer:</strong> {defaultNetwork.blockExplorerUrl}
            </p>
            <p>
              <strong>Testnet:</strong> {defaultNetwork.isTestnet ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Enabled:</strong> {defaultNetwork.enabled ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">🔗 All Networks</h3>
        <div className="space-y-2">
          {networks.map(network => (
            <div key={network.id} className="bg-white p-3 rounded border">
              <div className="flex justify-between items-start">
                <div>
                  <p>
                    <strong>{network.name}</strong> ({network.id})
                  </p>
                  <p className="text-sm text-gray-600">Type: {network.type}</p>
                  <p className="text-sm text-gray-600">RPC: {network.rpcUrl}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      network.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {network.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {network.isTestnet && (
                    <span className="ml-2 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                      Testnet
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">📈 Network Statistics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border text-center">
            <p className="text-2xl font-bold text-blue-600">
              {networkRegistry.getByType(NetworkType.SOLANA).length}
            </p>
            <p className="text-sm text-gray-600">Solana Networks</p>
          </div>
          <div className="bg-white p-3 rounded border text-center">
            <p className="text-2xl font-bold text-purple-600">
              {networkRegistry.getByType(NetworkType.EVM).length}
            </p>
            <p className="text-sm text-gray-600">EVM Networks</p>
          </div>
        </div>
      </div>
    </div>
  );
};
