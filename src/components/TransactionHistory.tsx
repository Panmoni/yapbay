import { useEffect, useState } from 'react';
import { getTradeTransactions, TransactionRecord } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { config } from '../config';

interface TransactionHistoryProps {
  tradeId: number;
  className?: string;
}

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

export const TransactionHistory = ({ tradeId, className = '' }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getTradeTransactions(tradeId);
        setTransactions(response.data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    if (tradeId) {
      fetchTransactions();
    }
  }, [tradeId]);

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

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Transaction History</h3>
          <button onClick={toggleExpand} className="text-gray-500 hover:text-gray-700">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        <div className="py-4 text-center text-gray-500">Loading transactions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Transaction History</h3>
          <button onClick={toggleExpand} className="text-gray-500 hover:text-gray-700">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        <div className="py-4 text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Transaction History</h3>
          <button onClick={toggleExpand} className="text-gray-500 hover:text-gray-700">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        <div className="py-4 text-center text-gray-500">No transactions found for this trade.</div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Transaction History</h3>
        <button onClick={toggleExpand} className="text-gray-500 hover:text-gray-700">
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {!isExpanded && (
        <div className="py-2 text-sm text-gray-500">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} recorded
        </div>
      )}

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hash
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                    {getTransactionTypeLabel(tx.transaction_type)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatAddress(tx.from_address)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tx.status)}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    <a 
                      href={getExplorerUrl(tx.transaction_hash)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:text-blue-800"
                    >
                      {formatAddress(tx.transaction_hash)}
                      <ExternalLink size={12} className="ml-1" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
