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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : health ? (
          <div className="space-y-8">
            {/* Basic Status */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Status:</span> {health.status}</p>
                  <p><span className="font-semibold">Timestamp:</span> {new Date(health.timestamp).toLocaleString()}</p>
                  <p><span className="font-semibold">User Wallet:</span> {health.userWallet}</p>
                  <p><span className="font-semibold">Database Status:</span> {health.dbStatus}</p>
                </div>
                <div>
                  <p><span className="font-semibold">API Version:</span> {health.apiVersion.version}</p>
                  <p><span className="font-semibold">Frontend Version:</span> {versionInfo.version}</p>
                  <p><span className="font-semibold">Contract Version:</span> {health.contractVersion}</p>
                  <p><span className="font-semibold">Build Date:</span> {new Date(health.apiVersion.buildDate).toLocaleString()}</p>
                </div>
              </div>
            </section>

            {/* API Version Details */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">API Version Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Git Commit:</span> {health.apiVersion.gitCommitHash}</p>
                  <p><span className="font-semibold">Git Branch:</span> {health.apiVersion.gitBranch}</p>
                  <p><span className="font-semibold">Build Date:</span> {new Date(health.apiVersion.buildDate).toLocaleString()}</p>
                  <p><span className="font-semibold">Dirty Build:</span> {health.apiVersion.isDirty ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </section>

            {/* Frontend Version Details */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">Frontend Version Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Git Commit:</span> {versionInfo.gitCommitHash}</p>
                  <p><span className="font-semibold">Git Branch:</span> {versionInfo.gitBranch}</p>
                  <p><span className="font-semibold">Build Date:</span> {new Date(versionInfo.buildDate).toLocaleString()}</p>
                  <p><span className="font-semibold">Dirty Build:</span> {versionInfo.isDirty ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </section>

            {/* Network Status */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">Network Status</h2>
              <div className="space-y-4">
                {health.networks.map((network) => (
                  <div key={network.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">{network.name}</h3>
                      <span className={`px-2 py-1 rounded text-sm ${
                        network.status === 'Connected' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {network.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p><span className="font-semibold">Chain ID:</span> {network.chainId}</p>
                      <p><span className="font-semibold">Provider:</span> {network.providerName}</p>
                      <p><span className="font-semibold">Contract:</span> {network.contractAddress}</p>
                      <p><span className="font-semibold">Type:</span> {network.isTestnet ? 'Testnet' : 'Mainnet'}</p>
                      <p><span className="font-semibold">Active:</span> {network.isActive ? 'Yes' : 'No'}</p>
                      <p><span className="font-semibold">Last Updated:</span> {new Date(network.updatedAt).toLocaleString()}</p>
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

            {/* Network Summary */}
            <section className="p-6">
              <h2 className="text-xl font-semibold mb-4">Network Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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