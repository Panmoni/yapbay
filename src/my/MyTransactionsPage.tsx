import { useEffect, useState } from 'react';
import { getUserTransactions, TransactionRecord, Account } from '../api';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink } from 'lucide-react';
import { config } from '../config';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { networkRegistry } from '../blockchain/networks';
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
import { Link } from 'react-router-dom';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MyTransactionsPageProps {
  account: Account | null;
}

const getTransactionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    CREATE_ESCROW: 'Create Escrow',
    FUND_ESCROW: 'Fund Escrow',
    MARK_FIAT_PAID: 'Mark Fiat Paid',
    RELEASE_ESCROW: 'Release Escrow',
    CANCEL_ESCROW: 'Cancel Escrow',
    OPEN_DISPUTE: 'Open Dispute',
    RESPOND_DISPUTE: 'Respond to Dispute',
    RESOLVE_DISPUTE: 'Resolve Dispute',
    OTHER: 'Other Transaction',
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

// Helper function to get transaction identifier (hash or signature)
const getTransactionId = (tx: TransactionRecord): string => {
  return tx.signature || tx.transaction_hash || '';
};

// Helper function to format transaction identifier for display
const formatTransactionId = (tx: TransactionRecord): string => {
  const txId = getTransactionId(tx);
  return formatAddress(txId);
};

const getExplorerUrl = (txHash: string, networkId?: string) => {
  // Return '#' if no transaction hash provided
  if (!txHash) return '#';

  // Get the network-specific explorer URL
  let explorerUrl: string;

  if (networkId) {
    const network = networkRegistry.get(networkId);
    if (network) {
      explorerUrl = network.blockExplorerUrl;
    } else {
      // Fallback to default network explorer
      explorerUrl = config.networks.testnet.blockExplorerUrl || 'https://alfajores.celoscan.io';
    }
  } else {
    // Fallback to default network explorer
    explorerUrl = config.networks.testnet.blockExplorerUrl || 'https://alfajores.celoscan.io';
  }

  // Handle Solana explorer URLs that have query parameters
  if (explorerUrl.includes('?')) {
    // Split the URL and query parameters
    const [baseUrl, queryParams] = explorerUrl.split('?');
    return `${baseUrl}/tx/${txHash}?${queryParams}`;
  } else {
    // Regular URL without query parameters
    return `${explorerUrl}/tx/${txHash}`;
  }
};

const getNetworkDisplayName = (networkId: string): string => {
  const networkNames: Record<string, string> = {
    'solana-devnet': 'Solana Devnet',
    'solana-mainnet': 'Solana Mainnet',
    'celo-alfajores': 'Celo Alfajores',
    'celo-mainnet': 'Celo Mainnet',
  };
  return networkNames[networkId] || networkId;
};

function MyTransactionsPage({ account }: MyTransactionsPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10; // Reduced from 20 to 10 to match MyOffersPage spacing

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
          type: filter === 'ALL' ? undefined : filter,
          limit,
          offset: (page - 1) * limit,
        });

        // Log the complete API response data
        console.log('MyTransactionsPage API Response:', response);
        console.log('MyTransactionsPage Response Data:', response.data);
        console.log('MyTransactionsPage Transactions Count:', response.data?.length);
        console.log('MyTransactionsPage Network Field Sample:', response.data?.[0]?.network);

        // Handle the response data
        setTransactions(response.data);

        // Set total count - the API might return total in response.data.length
        // or in a custom header or property. For now, use the array length
        setTotalCount(response.data.length);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [filter, page, account]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleNextPage = () => {
    if (page * limit < totalCount) {
      setPage(prev => prev + 1);
    }
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
              <CardDescription>View your transaction history</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Alert className="bg-neutral-50 border-neutral-200">
                <AlertDescription>
                  Please connect your wallet to view your transactions.
                </AlertDescription>
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
              <CardDescription>View your transaction history</CardDescription>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-primary-800 font-semibold">My Transactions</CardTitle>
                <CardDescription>View your transaction history</CardDescription>
              </div>
              <div className="w-full sm:w-auto">
                <Select value={filter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-full sm:w-[250px] border-neutral-300 focus:ring-primary-500">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-100">
                    <SelectItem value="ALL">All Transaction Types</SelectItem>
                    <SelectItem value="CREATE_ESCROW">Create Escrow</SelectItem>
                    <SelectItem value="FUND_ESCROW">Fund Escrow</SelectItem>
                    <SelectItem value="MARK_FIAT_PAID">Mark Fiat Paid</SelectItem>
                    <SelectItem value="RELEASE_ESCROW">Release Escrow</SelectItem>
                    <SelectItem value="CANCEL_ESCROW">Cancel Escrow</SelectItem>
                    <SelectItem value="OPEN_DISPUTE">Open Dispute</SelectItem>
                    <SelectItem value="RESPOND_DISPUTE">Respond to Dispute</SelectItem>
                    <SelectItem value="RESOLVE_DISPUTE">Resolve Dispute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            {error && (
              <Alert className="bg-red-50 border-red-200 mb-4">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
              </div>
            ) : transactions.length === 0 ? (
              <Alert className="bg-neutral-50 border-neutral-200">
                <AlertDescription>No transactions found.</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Mobile view */}
                <div className="md:hidden space-y-6">
                  {transactions.map(tx => (
                    <div key={tx.id} className="border rounded-lg p-5 hover:bg-neutral-50">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="font-medium text-neutral-800">
                            {getTransactionTypeLabel(tx.transaction_type)}
                          </span>
                          <div className="text-sm text-neutral-500 mt-1">
                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                            tx.status
                          )}`}
                        >
                          {tx.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                        <div>
                          <span className="text-neutral-500 block mb-1">ID:</span>
                          <span className="font-medium">{tx.id}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500 block mb-1">Trade:</span>
                          <Link
                            to={`/trade/${tx.trade_id}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {tx.trade_id}
                          </Link>
                        </div>
                        <div className="mt-2">
                          <span className="text-neutral-500 block mb-1">From:</span>
                          <span>{formatAddress(tx.from_address)}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-neutral-500 block mb-1">To:</span>
                          <span>{tx.to_address ? formatAddress(tx.to_address) : '-'}</span>
                        </div>
                        <div className="col-span-2 mt-2">
                          <span className="text-neutral-500 block mb-1">Amount:</span>
                          <span>{tx.amount ? `${tx.amount} ${tx.token_type || 'USDC'}` : '-'}</span>
                        </div>
                        <div className="col-span-2 mt-2">
                          <span className="text-neutral-500 block mb-1">Network:</span>
                          <span>{tx.network ? getNetworkDisplayName(tx.network) : '-'}</span>
                        </div>
                        <div className="col-span-2 mt-2">
                          <span className="text-neutral-500 block mb-1">Transaction:</span>
                          <a
                            href={getExplorerUrl(getTransactionId(tx), tx.network)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:text-blue-800"
                          >
                            {formatTransactionId(tx)}
                            <ExternalLink size={14} className="ml-1" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-primary-700 font-medium">ID</TableHead>
                        <TableHead className="text-primary-700 font-medium">Type</TableHead>
                        <TableHead className="text-primary-700 font-medium">Trade ID</TableHead>
                        <TableHead className="text-primary-700 font-medium">From</TableHead>
                        <TableHead className="text-primary-700 font-medium">To</TableHead>
                        <TableHead className="text-primary-700 font-medium">Amount</TableHead>
                        <TableHead className="text-primary-700 font-medium">Network</TableHead>
                        <TableHead className="text-primary-700 font-medium">Status</TableHead>
                        <TableHead className="text-primary-700 font-medium">Time</TableHead>
                        <TableHead className="text-primary-700 font-medium">Transaction</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx.id} className="hover:bg-neutral-50">
                          <TableCell className="font-medium">{tx.id}</TableCell>
                          <TableCell>{getTransactionTypeLabel(tx.transaction_type)}</TableCell>
                          <TableCell>
                            <Link
                              to={`/trade/${tx.trade_id}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {tx.trade_id}
                            </Link>
                          </TableCell>
                          <TableCell>{formatAddress(tx.from_address)}</TableCell>
                          <TableCell>
                            {tx.to_address ? formatAddress(tx.to_address) : '-'}
                          </TableCell>
                          <TableCell>
                            {tx.amount ? `${tx.amount} ${tx.token_type || 'USDC'}` : '-'}
                          </TableCell>
                          <TableCell>
                            {tx.network ? getNetworkDisplayName(tx.network) : '-'}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                                tx.status
                              )}`}
                            >
                              {tx.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-neutral-500 text-sm">
                            {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>
                            <a
                              href={getExplorerUrl(getTransactionId(tx), tx.network)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              {formatTransactionId(tx)}
                              <ExternalLink size={14} className="ml-1" />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={handlePrevPage}
                          className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>

                      {Array.from({ length: Math.ceil(totalCount / limit) })
                        .map((_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              isActive={page === i + 1}
                              onClick={() => setPage(i + 1)}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))
                        .slice(
                          Math.max(0, page - 3),
                          Math.min(Math.ceil(totalCount / limit), page + 2)
                        )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={handleNextPage}
                          className={
                            page * limit >= totalCount ? 'pointer-events-none opacity-50' : ''
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
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
