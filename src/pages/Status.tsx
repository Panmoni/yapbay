import React, { useEffect, useState } from 'react';
import { getHealth, HealthResponse } from '@/api';
import Container from '@/components/Shared/Container';
import { versionInfo } from '@/utils/version';

export const Status: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await getHealth();
        setHealth(response.data);
      } catch (err) {
        setError('Failed to fetch system status');
        console.error('Health check failed:', err);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-8">System Status</h1>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        ) : health ? (
          <div className="space-y-4">
            {/* Basic Status */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <span className="font-semibold">Status:</span> {health.status}
                  </p>
                  <p>
                    <span className="font-semibold">Timestamp:</span>{' '}
                    {new Date(health.timestamp).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-semibold">User Wallet:</span> {health.userWallet}
                  </p>
                  <p>
                    <span className="font-semibold">Database Status:</span> {health.dbStatus}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-semibold">API Version:</span> {health.apiVersion.version}
                  </p>
                  <p>
                    <span className="font-semibold">Frontend Version:</span> {versionInfo.version}
                  </p>
                  <p>
                    <span className="font-semibold">Contract Version:</span>{' '}
                    {health.contractVersion}
                  </p>
                  <p>
                    <span className="font-semibold">Build Date:</span>{' '}
                    {new Date(health.apiVersion.buildDate).toLocaleString()}
                  </p>
                </div>
              </div>
            </section>

            {/* API Version Details */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">API Version Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <span className="font-semibold">Git Commit:</span>{' '}
                    {health.apiVersion.gitCommitHash}
                  </p>
                  <p>
                    <span className="font-semibold">Git Branch:</span> {health.apiVersion.gitBranch}
                  </p>
                  <p>
                    <span className="font-semibold">Git Commit Date:</span>{' '}
                    {new Date(health.apiVersion.gitCommitDate).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-semibold">Build Date:</span>{' '}
                    {new Date(health.apiVersion.buildDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p>
                    <span className="font-semibold">Dirty Build:</span>{' '}
                    {health.apiVersion.isDirty ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </section>

            {/* Frontend Version Details */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">Frontend Version Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p>
                    <span className="font-semibold">Git Commit:</span> {versionInfo.gitCommitHash}
                  </p>
                  <p>
                    <span className="font-semibold">Git Branch:</span> {versionInfo.gitBranch}
                  </p>
                  <p>
                    <span className="font-semibold">Build Date:</span>{' '}
                    {new Date(versionInfo.buildDate).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-semibold">Dirty Build:</span>{' '}
                    {versionInfo.isDirty ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>
            </section>

            {/* Database Status */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">Database Status</h2>
              <div className="mb-4">
                <p>
                  <span className="font-semibold">Status:</span> {health.database.status}
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Accounts</p>
                  <p className="text-2xl font-bold">{health.database.counts.accounts}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Escrows</p>
                  <p className="text-2xl font-bold">{health.database.counts.escrows}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Offers</p>
                  <p className="text-2xl font-bold">{health.database.counts.offers}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Trades</p>
                  <p className="text-2xl font-bold">{health.database.counts.trades}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Transactions</p>
                  <p className="text-2xl font-bold">{health.database.counts.transactions}</p>
                </div>
              </div>
            </section>

            {/* Network Summary */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">Network Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Networks</p>
                  <p className="text-2xl font-bold">{health.summary.totalNetworks}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Active Networks</p>
                  <p className="text-2xl font-bold">{health.summary.activeNetworks}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Connected Networks</p>
                  <p className="text-2xl font-bold">{health.summary.connectedNetworks}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Error Networks</p>
                  <p className="text-2xl font-bold">{health.summary.errorNetworks}</p>
                </div>
                {/* <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">EVM Networks</p>
                  <p className="text-2xl font-bold">{health.summary.evmNetworks}</p>
                </div> */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Solana Networks</p>
                  <p className="text-2xl font-bold">{health.summary.solanaNetworks}</p>
                </div>
              </div>
            </section>

            {/* Network Status */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">Network Status</h2>
              <div className="space-y-4">
                {health.networks
                  .filter(network => !network.name.includes('celo'))
                  .map(network => (
                    <div key={network.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{network.name}</h3>
                        <span
                          className={`px-2 py-1 rounded text-sm ${
                            network.status === 'Connected'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {network.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <p>
                          <span className="font-semibold">Chain ID:</span> {network.chainId}
                        </p>
                        <p>
                          <span className="font-semibold">Provider:</span> {network.providerName}
                        </p>
                        <p>
                          <span className="font-semibold">Network Family:</span>{' '}
                          {network.networkFamily}
                        </p>
                        <p>
                          <span className="font-semibold">Type:</span>{' '}
                          {network.isTestnet ? 'Testnet' : 'Mainnet'}
                        </p>
                        <p>
                          <span className="font-semibold">Active:</span>{' '}
                          {network.isActive ? 'Yes' : 'No'}
                        </p>
                        <p>
                          <span className="font-semibold">Created:</span>{' '}
                          {new Date(network.createdAt).toLocaleString()}
                        </p>
                        <p>
                          <span className="font-semibold">Last Updated:</span>{' '}
                          {new Date(network.updatedAt).toLocaleString()}
                        </p>
                        {network.providerChainId && (
                          <p>
                            <span className="font-semibold">Provider Chain ID:</span>{' '}
                            {network.providerChainId}
                          </p>
                        )}
                        <p>
                          <span className="font-semibold">RPC URL:</span>{' '}
                          {network.rpcUrl
                            ? (() => {
                                try {
                                  const url = new URL(network.rpcUrl);
                                  const parts = url.hostname.split('.');
                                  return parts.length >= 2
                                    ? parts.slice(-2).join('.')
                                    : url.hostname;
                                } catch {
                                  return network.rpcUrl;
                                }
                              })()
                            : 'N/A'}
                        </p>
                        {network.contractAddress && (
                          <p>
                            <span className="font-semibold">Contract:</span>
                            <a
                              href={`${network.blockExplorerUrl?.replace(
                                '/tx/0x0000000000000000000000000000000000000000000000000000000000000000',
                                '/address/'
                              )}${network.contractAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              {network.contractAddress}
                            </a>
                          </p>
                        )}
                        {network.programId && (
                          <p>
                            <span className="font-semibold">Program ID:</span>
                            <a
                              href={`${network.blockExplorerUrl?.replace(
                                '/tx/1111111111111111111111111111111111111111111111111111111111111111',
                                '/address/'
                              )}${network.programId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              {network.programId}
                            </a>
                          </p>
                        )}
                        {network.arbitratorAddress && (
                          <p>
                            <span className="font-semibold">Arbitrator:</span>
                            <a
                              href={`${network.blockExplorerUrl
                                ?.replace(
                                  '/tx/0x0000000000000000000000000000000000000000000000000000000000000000',
                                  '/address/'
                                )
                                .replace(
                                  '/tx/1111111111111111111111111111111111111111111111111111111111111111',
                                  '/address/'
                                )}${network.arbitratorAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              {network.arbitratorAddress}
                            </a>
                          </p>
                        )}
                        {network.usdcMint && (
                          <p>
                            <span className="font-semibold">USDC Mint:</span>
                            <a
                              href={`${network.blockExplorerUrl?.replace(
                                '/tx/1111111111111111111111111111111111111111111111111111111111111111',
                                '/address/'
                              )}${network.usdcMint}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              {network.usdcMint}
                            </a>
                          </p>
                        )}
                        {network.wsUrl && (
                          <p>
                            <span className="font-semibold">WebSocket URL:</span>
                            <a
                              href={network.wsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-1 break-all"
                            >
                              {network.wsUrl.length > 50
                                ? `${network.wsUrl.substring(0, 50)}...`
                                : network.wsUrl}
                            </a>
                          </p>
                        )}
                        {network.blockExplorerUrl && (
                          <p>
                            <span className="font-semibold">Block Explorer:</span>
                            <a
                              href={network.blockExplorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 ml-1"
                            >
                              View Explorer
                            </a>
                          </p>
                        )}
                      </div>
                      {network.error && (
                        <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
                          Error: {network.error}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Status;
