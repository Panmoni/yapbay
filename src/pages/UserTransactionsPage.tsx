import { useEffect, useState } from 'react';
import { getUserTransactions, TransactionRecord } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { config } from '../config';

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    'CREATE_ESCROW': 'Create Escrow',
    'FUND_ESCROW': 'Fund Escrow',
    'MARK_FIAT_PAID': 'Mark Fiat Paid',
    'RELEASE_ESCROW': 'Release Escrow',
    'CANCEL_ESCROW': 'Cancel Escrow',
    'DISPUTE_ESCROW': 'Open Dispute',
    'OPEN_DISPUTE': 'Open Dispute',
    'RESPOND_DISPUTE': 'Respond to Dispute',
    'RESOLVE_DISPUTE': 'Resolve Dispute',
    'OTHER': 'Other Transaction'
  };
  return labels[type] || type;
};

const getStatusBadgeClass = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'SUCCESS':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const UserTransactionsPage = () => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUserTransactions({
          type: filter || undefined,
          limit,
          offset: (page - 1) * limit
        });
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filter, page]);

  const getExplorerUrl = (txHash: string) => {
    // Use a default explorer URL if not defined in config
    // Cast config to a more specific type to avoid TypeScript errors
    interface ExtendedConfig {
      apiUrl: string;
      dynamicSdkId: string;
      celoRpcUrl: string;
      contractAddress: string;
      usdcAddressAlfajores: string;
      arbitratorAddress: string;
      blockExplorerUrl?: string;
    }
    const explorerUrl = (config as ExtendedConfig).blockExplorerUrl || 'https://explorer.celo.org';
    return `${explorerUrl}/tx/${txHash}`;
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleNextPage = () => {
    setPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Transactions</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <label htmlFor="filter" className="mr-2 text-sm font-medium text-gray-700">
              Filter by type:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={handleFilterChange}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">All Transactions</option>
              <option value="CREATE_ESCROW">Create Escrow</option>
              <option value="FUND_ESCROW">Fund Escrow</option>
              <option value="MARK_FIAT_PAID">Mark Fiat Paid</option>
              <option value="RELEASE_ESCROW">Release Escrow</option>
              <option value="CANCEL_ESCROW">Cancel Escrow</option>
              <option value="DISPUTE_ESCROW">Dispute Escrow</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={page === 1}
              className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button
              onClick={handleNextPage}
              disabled={transactions.length < limit}
              className={`px-3 py-1 rounded ${transactions.length < limit ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              Next
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading transactions...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trade ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getTransactionTypeLabel(tx.transaction_type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a 
                        href={`/trades/${tx.trade_id}`} 
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {tx.trade_id}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatAddress(tx.from_address)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.to_address ? formatAddress(tx.to_address) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tx.amount ? `${tx.amount} ${tx.token_type || 'USDC'}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <a 
                        href={getExplorerUrl(tx.transaction_hash)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        {formatAddress(tx.transaction_hash)}
                        <ExternalLink size={14} className="ml-1" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTransactionsPage;
