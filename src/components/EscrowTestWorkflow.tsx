/**
 * Escrow Test Workflow Component
 * Provides UI for testing the complete escrow lifecycle
 */

import React, { useState, useEffect } from 'react';
import { EscrowTestManager, EscrowTestState } from '../utils/EscrowTestManager.js';
import { UnifiedBlockchainService } from '../services/blockchainService.js';
import { TransactionResult, EscrowState } from '../blockchain/types/index.js';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface EscrowTestWorkflowProps {
  blockchainService: UnifiedBlockchainService;
}

interface TestStep {
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

const TransactionResultDisplay: React.FC<{ result: TransactionResult; index: number }> = ({
  result,
  index,
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg mb-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-600">Transaction #{index + 1}</span>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {result.success ? 'Success' : 'Failed'}
        </span>
      </div>

      {result.signature && (
        <div className="mb-2">
          <a
            href={`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm break-all"
          >
            View on Solana Explorer: {result.signature.slice(0, 8)}...{result.signature.slice(-8)}
          </a>
        </div>
      )}

      {result.error && <p className="text-red-600 text-sm">{result.error}</p>}

      {result.slot && <p className="text-gray-500 text-xs">Slot: {result.slot}</p>}
    </div>
  );
};

const EscrowStateDisplay: React.FC<{ state?: EscrowState }> = ({ state }) => {
  if (!state) return null;

  const getStateColor = (state: string) => {
    switch (state) {
      case 'CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'FUNDED':
        return 'bg-yellow-100 text-yellow-800';
      case 'RELEASED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'DISPUTED':
        return 'bg-orange-100 text-orange-800';
      case 'RESOLVED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h4 className="font-semibold text-gray-900 mb-3">Current Escrow State</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-600">Escrow ID</p>
          <p className="font-mono">{state.id}</p>
        </div>
        <div>
          <p className="text-gray-600">Trade ID</p>
          <p className="font-mono">{state.tradeId}</p>
        </div>
        <div>
          <p className="text-gray-600">State</p>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStateColor(state.state)}`}>
            {state.state}
          </span>
        </div>
        <div>
          <p className="text-gray-600">Amount</p>
          <p className="font-mono">{state.amount}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-600">Seller</p>
          <p className="font-mono text-xs break-all">{state.sellerAddress}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-600">Buyer</p>
          <p className="font-mono text-xs break-all">{state.buyerAddress}</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-600">Arbitrator</p>
          <p className="font-mono text-xs break-all">{state.arbitratorAddress}</p>
        </div>
      </div>
    </div>
  );
};

export const EscrowTestWorkflow: React.FC<EscrowTestWorkflowProps> = ({ blockchainService }) => {
  const { primaryWallet } = useDynamicContext();
  const [testManager, setTestManager] = useState<EscrowTestManager | null>(null);
  const [testState, setTestState] = useState<EscrowTestState>({
    currentStep: 0,
    transactionResults: [],
    isRunning: false,
    walletConnected: false,
  });

  const lifecycleSteps: TestStep[] = [
    { name: 'Initialize', description: 'Set up test data and wallets', status: 'pending' },
    {
      name: 'Create Escrow',
      description: 'Create new escrow with seller, buyer, arbitrator',
      status: 'pending',
    },
    { name: 'Fund Escrow', description: 'Transfer USDC to escrow account', status: 'pending' },
    { name: 'Mark Fiat Paid', description: 'Mark fiat payment as completed', status: 'pending' },
    { name: 'Release Escrow', description: 'Release funds to seller', status: 'pending' },
    {
      name: 'Verify State',
      description: 'Verify final escrow state and balances',
      status: 'pending',
    },
  ];

  const disputeSteps: TestStep[] = [
    { name: 'Initialize', description: 'Set up test data and wallets', status: 'pending' },
    { name: 'Create Escrow', description: 'Create new escrow', status: 'pending' },
    { name: 'Fund Escrow', description: 'Transfer USDC to escrow', status: 'pending' },
    { name: 'Open Dispute', description: 'Buyer opens dispute with bond', status: 'pending' },
    { name: 'Respond to Dispute', description: 'Seller responds with bond', status: 'pending' },
    { name: 'Resolve Dispute', description: 'Arbitrator resolves dispute', status: 'pending' },
    { name: 'Verify Resolution', description: 'Verify final state', status: 'pending' },
  ];

  useEffect(() => {
    const walletAddress = primaryWallet?.address;
    const manager = new EscrowTestManager(blockchainService, walletAddress, setTestState);
    setTestManager(manager);
  }, [blockchainService, primaryWallet?.address]);

  // Update wallet connection status when Dynamic wallet changes
  useEffect(() => {
    if (testManager) {
      testManager.updateWalletAddress(primaryWallet?.address);
    }
  }, [primaryWallet?.address, testManager]);

  const handleLifecycleTest = async () => {
    if (!testManager) return;

    try {
      await testManager.runCompleteLifecycleTest();
    } catch (error) {
      console.error('Lifecycle test failed:', error);
    }
  };

  const handleDisputeTest = async () => {
    if (!testManager) return;

    try {
      await testManager.runDisputeWorkflowTest();
    } catch (error) {
      console.error('Dispute test failed:', error);
    }
  };

  const handleCleanup = async () => {
    if (!testManager) return;

    try {
      await testManager.cleanup();
      setTestState({
        currentStep: 0,
        transactionResults: [],
        isRunning: false,
        walletConnected: false,
      });
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const getStepStatus = (stepIndex: number): TestStep['status'] => {
    if (testState.isRunning) {
      if (stepIndex < testState.currentStep) return 'completed';
      if (stepIndex === testState.currentStep) return 'running';
      return 'pending';
    }

    if (testState.error) {
      if (stepIndex < testState.currentStep) return 'completed';
      if (stepIndex === testState.currentStep) return 'failed';
      return 'pending';
    }

    return 'pending';
  };

  const getStatusIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'running':
        return '🔄';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusColor = (status: TestStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'running':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">🧪 Escrow Lifecycle Testing</h2>

      {/* Wallet Connection Status */}
      <div className="mb-6">
        <div
          className={`p-4 rounded-lg border ${
            testState.walletConnected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{testState.walletConnected ? '🟢' : '🔴'}</span>
              <div>
                <h3
                  className={`font-semibold ${
                    testState.walletConnected ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {testState.walletConnected ? 'Wallet Connected' : 'Wallet Not Connected'}
                </h3>
                {testState.walletAddress && (
                  <p className="text-sm text-gray-600 font-mono">
                    {testState.walletAddress.slice(0, 8)}...{testState.walletAddress.slice(-8)}
                  </p>
                )}
              </div>
            </div>
            {!testState.walletConnected && (
              <div className="text-sm text-red-700">Please connect your wallet to run tests</div>
            )}
          </div>
        </div>
      </div>

      {/* Test Controls */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={handleLifecycleTest}
            disabled={testState.isRunning || !testState.walletConnected}
            className={`px-6 py-3 rounded-lg font-medium ${
              testState.isRunning || !testState.walletConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {testState.isRunning ? '🔄 Running...' : '🚀 Run Complete Lifecycle Test'}
          </button>

          <button
            onClick={handleDisputeTest}
            disabled={testState.isRunning || !testState.walletConnected}
            className={`px-6 py-3 rounded-lg font-medium ${
              testState.isRunning || !testState.walletConnected
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {testState.isRunning ? '🔄 Running...' : '⚖️ Run Dispute Workflow Test'}
          </button>

          <button
            onClick={handleCleanup}
            disabled={testState.isRunning}
            className={`px-4 py-3 rounded-lg font-medium ${
              testState.isRunning
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            🧹 Cleanup
          </button>
        </div>

        {testState.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="text-red-800 font-semibold mb-2">❌ Test Error</h4>
            <p className="text-red-700">{testState.error}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lifecycle Test Steps */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Lifecycle Test Steps</h3>
          <div className="space-y-3">
            {lifecycleSteps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <span className="text-lg">{getStatusIcon(status)}</span>
                  <div className="flex-1">
                    <p className={`font-medium ${getStatusColor(status)}`}>{step.name}</p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dispute Test Steps */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚖️ Dispute Test Steps</h3>
          <div className="space-y-3">
            {disputeSteps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                  <span className="text-lg">{getStatusIcon(status)}</span>
                  <div className="flex-1">
                    <p className={`font-medium ${getStatusColor(status)}`}>{step.name}</p>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Escrow State */}
      {testState.escrowState && (
        <div className="mt-8">
          <EscrowStateDisplay state={testState.escrowState} />
        </div>
      )}

      {/* Transaction Results */}
      {testState.transactionResults.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Transaction Results</h3>
          <div className="space-y-2">
            {testState.transactionResults.map((result, index) => (
              <TransactionResultDisplay key={index} result={result} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Test Data Display */}
      {testState.testData && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔧 Test Data</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Seller Wallet</p>
                <p className="font-mono text-xs break-all">
                  {testState.testData.sellerWallet.publicKey.toString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Buyer Wallet</p>
                <p className="font-mono text-xs break-all">
                  {testState.testData.buyerWallet.publicKey.toString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Arbitrator</p>
                <p className="font-mono text-xs break-all">
                  {testState.testData.arbitratorAddress}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Amount</p>
                <p className="font-mono">{testState.testData.amount} (10 USDC)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
