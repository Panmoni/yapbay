import { useCallback, useEffect, useState } from 'react';
import { getTradeTransactions, TransactionRecord } from '../../../api';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { config } from '../../../config';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface TransactionHistoryProps {
  tradeId: number;
  className?: string;
}

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    CREATE_ESCROW: 'Create Escrow',
    FUND_ESCROW: 'Fund Escrow',
    MARK_FIAT_PAID: 'Mark Fiat Paid',
    RELEASE_ESCROW: 'Release Escrow',
    CANCEL_ESCROW: 'Cancel Escrow',
    DISPUTE_ESCROW: 'Dispute Escrow',
    OPEN_DISPUTE: 'Open Dispute',
    RESPOND_DISPUTE: 'Respond to Dispute',
    RESOLVE_DISPUTE: 'Resolve Dispute',
    BUYER_CONFIRMED: 'Buyer Confirmed',
    SELLER_CONFIRMED: 'Seller Confirmed',
    ESCROW_FUNDED: 'Escrow Funded',
    ESCROW_RELEASED: 'Escrow Released',
    ESCROW_CANCELLED: 'Escrow Cancelled',
    FIAT_PAID: 'Fiat Paid',
    OTHER: 'Other Transaction',
  };
  return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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
  const [isOpen, setIsOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const response = await getTradeTransactions(tradeId);
      console.log('Fetched transaction records:', response.data);
      setTransactions(response.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transaction history');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  }, [tradeId]);

  useEffect(() => {
    setLoading(true);
    fetchTransactions();
    const interval = setInterval(() => {
      fetchTransactions();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  const getExplorerUrl = (txHash: string) => {
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

  return (
    <TooltipProvider>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={`w-full border rounded-md p-2 mt-4 bg-white ${className}`}
      >
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 font-medium">
              <span>Transaction History</span>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-neutral-500">
                    {isRefreshing
                      ? 'Refreshing...'
                      : `Updated ${formatDistanceToNow(lastUpdated)} ago`}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-neutral-50">
                  <p>Auto-refreshes every minute</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Button variant="outline" size="sm" onClick={fetchTransactions} disabled={isRefreshing}>
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
        <CollapsibleContent>
          {loading ? (
            <div className="py-4 text-center text-gray-500">Loading transactions...</div>
          ) : error ? (
            <div className="py-4 text-center text-red-500">{error}</div>
          ) : transactions.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No transactions found for this trade.
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hash
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {getTransactionTypeLabel(tx.transaction_type)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {tx.from_address ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>{formatAddress(tx.from_address)}</span>
                            </TooltipTrigger>
                            <TooltipContent>{tx.from_address}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-gray-400 italic">Unknown</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Badge className={getStatusBadgeClass(tx.status)}>{tx.status}</Badge>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : <span className="text-gray-400 italic">Unknown</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                        {tx.transaction_hash ? (
                          <a
                            href={getExplorerUrl(tx.transaction_hash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            <span>{formatAddress(tx.transaction_hash)}</span>
                            <ExternalLink size={12} className="ml-1" />
                          </a>
                        ) : (
                          <span className="text-gray-400 italic">Unknown</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4 text-xs text-neutral-600 text-center">
            Transaction history automatically updates every minute.
          </div>
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
};

export default TransactionHistory;
