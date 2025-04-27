import { useEffect, useState } from 'react';
import { getUserTransactions, TransactionRecord, Account } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { config } from '../config';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Container from '@/components/Shared/Container';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface MyTransactionsPageProps {
  account: Account | null;
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

function MyTransactionsPage({ account }: MyTransactionsPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!account) {
        setLoading(false);
        return;
      }
      
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
  }, [filter, page, account]);

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

  if (!primaryWallet) {
    return (
      <TooltipProvider>
        <Container>
          <Card>
            <CardHeader className="border-b border-neutral-100">
              <CardTitle className="text-primary-800 font-semibold">My Transactions</CardTitle>
              <CardDescription>View your blockchain transaction history</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Alert className="bg-neutral-50 border-neutral-200">
                <AlertDescription>Please connect your wallet to view your transactions.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </Container>
      </TooltipProvider>
    );
  }

  if (!account) {
    return (
      <TooltipProvider>
        <Container>
          <Card>
            <CardHeader>
              <CardTitle className="text-primary-800 font-semibold">My Transactions</CardTitle>
              <CardDescription>View your blockchain transaction history</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-700">
                  Please create an account first to view your transactions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </Container>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Container>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-800 font-semibold">My Transactions</CardTitle>
            <CardDescription>View your blockchain transaction history</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert className="bg-red-50 border-red-200 mb-4">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <div className="mb-4 flex justify-between items-center">
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
                <Button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">Page {page}</span>
                <Button
                  onClick={handleNextPage}
                  disabled={transactions.length < limit}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No transactions found.</div>
            ) : (
              <>
                {/* Mobile view */}
                <div className="md:hidden space-y-4">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">
                          {getTransactionTypeLabel(tx.transaction_type)}
                        </span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tx.status)}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-gray-500">Trade ID:</span>
                        <a 
                          href={`/trades/${tx.trade_id}`} 
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {tx.trade_id}
                        </a>
                        <span className="text-gray-500">From:</span>
                        <span>{formatAddress(tx.from_address)}</span>
                        {tx.to_address && (
                          <>
                            <span className="text-gray-500">To:</span>
                            <span>{formatAddress(tx.to_address)}</span>
                          </>
                        )}
                        {tx.amount && (
                          <>
                            <span className="text-gray-500">Amount:</span>
                            <span>{tx.amount} {tx.token_type || 'USDC'}</span>
                          </>
                        )}
                        <span className="text-gray-500">Time:</span>
                        <span>{formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}</span>
                        <span className="text-gray-500">Transaction:</span>
                        <a 
                          href={getExplorerUrl(tx.transaction_hash)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          {formatAddress(tx.transaction_hash)}
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-primary-700 font-medium">Type</TableHead>
                        <TableHead className="text-primary-700 font-medium">Trade ID</TableHead>
                        <TableHead className="text-primary-700 font-medium">From</TableHead>
                        <TableHead className="text-primary-700 font-medium">To</TableHead>
                        <TableHead className="text-primary-700 font-medium">Amount</TableHead>
                        <TableHead className="text-primary-700 font-medium">Status</TableHead>
                        <TableHead className="text-primary-700 font-medium">Time</TableHead>
                        <TableHead className="text-primary-700 font-medium">Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => (
                        <TableRow key={tx.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{getTransactionTypeLabel(tx.transaction_type)}</TableCell>
                          <TableCell>
                            <a 
                              href={`/trades/${tx.trade_id}`} 
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {tx.trade_id}
                            </a>
                          </TableCell>
                          <TableCell>{formatAddress(tx.from_address)}</TableCell>
                          <TableCell>{tx.to_address ? formatAddress(tx.to_address) : '-'}</TableCell>
                          <TableCell>{tx.amount ? `${tx.amount} ${tx.token_type || 'USDC'}` : '-'}</TableCell>
                          <TableCell>
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(tx.status)}`}>
                              {tx.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-gray-500 text-sm">
                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <a 
                              href={getExplorerUrl(tx.transaction_hash)} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              {formatAddress(tx.transaction_hash)}
                              <ExternalLink size={14} className="ml-1" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </TooltipProvider>
  );
}

export default MyTransactionsPage;
