/**
 * Test component for Unified Blockchain Service
 */

import React, { useState } from 'react';
import { useBlockchainService } from '../hooks/useBlockchainService.js';

export const BlockchainServiceTest: React.FC = () => {
  const { service, currentNetwork, walletAddress, isConnected, networkName, isTestnet, error } =
    useBlockchainService();

  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testService = async () => {
    setTestResults([]);
    addTestResult('🧪 Starting blockchain service tests...');

    try {
      // Test 1: Network info
      addTestResult(`✅ Current network: ${networkName} (${currentNetwork.type})`);
      addTestResult(`✅ Network ID: ${currentNetwork.id}`);
      addTestResult(`✅ RPC URL: ${currentNetwork.rpcUrl}`);
      addTestResult(`✅ Is testnet: ${isTestnet}`);

      // Test 2: Wallet connection
      if (isConnected) {
        addTestResult(`✅ Wallet connected: ${walletAddress}`);
      } else {
        addTestResult('⚠️ Wallet not connected');
      }

      // Test 3: Service methods (these will throw "not implemented" errors, which is expected)
      try {
        await service.getWalletBalance();
      } catch (err) {
        addTestResult(`✅ getWalletBalance() throws expected error: ${(err as Error).message}`);
      }

      try {
        await service.createEscrow({
          escrowId: 1,
          tradeId: 1,
          sellerAddress: 'test',
          buyerAddress: 'test',
          arbitratorAddress: 'test',
          amount: '10',
          depositDeadline: Date.now() / 1000 + 3600,
          fiatDeadline: Date.now() / 1000 + 7200,
        });
      } catch (err) {
        addTestResult(`✅ createEscrow() throws expected error: ${(err as Error).message}`);
      }

      addTestResult('🎉 All tests completed successfully!');
    } catch (err) {
      addTestResult(`❌ Test failed: ${(err as Error).message}`);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🔧 Blockchain Service Test</h2>

      {/* Service Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">📊 Service Status</h3>
        <div className="bg-white p-4 rounded border">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Network</p>
              <p className="font-semibold">{networkName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-semibold">{currentNetwork.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Wallet</p>
              <p className="font-semibold">{isConnected ? 'Connected' : 'Not Connected'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-mono text-sm break-all">{walletAddress || 'None'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Network Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">🔗 Network Details</h3>
        <div className="bg-white p-4 rounded border">
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Network ID</p>
              <p className="font-mono text-sm">{currentNetwork.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">RPC URL</p>
              <p className="font-mono text-sm break-all">{currentNetwork.rpcUrl}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Block Explorer</p>
              <p className="font-mono text-sm break-all">{currentNetwork.blockExplorerUrl}</p>
            </div>
            {currentNetwork.programId && (
              <div>
                <p className="text-sm text-gray-600">Program ID</p>
                <p className="font-mono text-sm break-all">{currentNetwork.programId}</p>
              </div>
            )}
            {currentNetwork.usdcMint && (
              <div>
                <p className="text-sm text-gray-600">USDC Mint</p>
                <p className="font-mono text-sm break-all">{currentNetwork.usdcMint}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">🧪 Test Controls</h3>
        <div className="flex space-x-4">
          <button
            onClick={testService}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Run Tests
          </button>
          <button
            onClick={() => setTestResults([])}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Results
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">📋 Test Results</h3>
          <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};
