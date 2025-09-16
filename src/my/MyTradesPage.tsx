import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Link } from 'react-router-dom';
import { getMyTrades, Trade, Account } from '@/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import Container from '@/components/Shared/Container';
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

interface MyTradesPageProps {
  account: Account | null;
}

function MyTradesPage({ account }: MyTradesPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [myTrades, setMyTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<string>('ALL');
  const limit = 10;

  useEffect(() => {
    const fetchMyTrades = async () => {
      if (!account || !primaryWallet) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getMyTrades();
        let sortedTrades = response.data.trades;

        // Apply status filter if not ALL
        if (filter !== 'ALL') {
          sortedTrades = sortedTrades.filter((trade: Trade) => trade.leg1_state === filter);
        }

        // Sort by creation date
        sortedTrades = sortedTrades.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setTotalCount(sortedTrades.length);

        const paginatedTrades = sortedTrades.slice((page - 1) * limit, page * limit);
        setMyTrades(paginatedTrades);

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[MyTradesPage] Fetch failed:', err);
        setError(`Failed to load your trades: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTrades();
  }, [account, primaryWallet, page, limit, filter]);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    setPage(1); // Reset to first page when filter changes
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'bg-blue-500 text-white';
      case 'FUNDED':
        return 'bg-teal-500 text-white';
      case 'AWAITING_FIAT_PAYMENT':
        return 'bg-amber-500 text-white';
      case 'FIAT_PAID':
        return 'bg-indigo-500 text-white';
      case 'PENDING_CRYPTO_RELEASE':
        return 'bg-purple-500 text-white';
      case 'COMPLETED':
        return 'bg-success text-white';
      case 'RELEASED':
        return 'bg-green-600 text-white';
      case 'CANCELLED':
        return 'bg-neutral-500 text-white';
      case 'DISPUTED':
        return 'bg-error text-white';
      case 'RESOLVED':
        return 'bg-blue-700 text-white';
      default:
        return 'bg-neutral-300 text-neutral-800';
    }
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
      <Container>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-800 font-semibold">My Trades</CardTitle>
            <CardDescription>View and manage your active trades</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-neutral-50 border-neutral-200">
              <AlertDescription>Please connect your wallet to view your trades.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!account) {
    return (
      <Container>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-800 font-semibold">My Trades</CardTitle>
            <CardDescription>View and manage your active trades</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-700">
                Please create an account first to view your trades.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-primary-800 font-semibold">My Trades</CardTitle>
              <CardDescription>View and manage your active trades</CardDescription>
            </div>
            <div className="w-full sm:w-auto">
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-50">
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="CREATED">Created</SelectItem>
                  <SelectItem value="FUNDED">Funded</SelectItem>
                  <SelectItem value="AWAITING_FIAT_PAYMENT">Awaiting Payment</SelectItem>
                  <SelectItem value="FIAT_PAID">Fiat Paid</SelectItem>
                  <SelectItem value="PENDING_CRYPTO_RELEASE">Pending Release</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
            </div>
          ) : error ? (
            <Alert className="bg-red-50 border-red-200 mb-4">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          ) : myTrades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 mb-4">You don't have any trades yet.</p>
              <Button className="bg-primary-800 hover:bg-primary-300 w-full sm:w-auto" asChild>
                <Link to="/">
                  <span className="text-neutral-100">Find Offers</span>
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden space-y-4">
                {myTrades.map(trade => (
                  <div
                    key={trade.id}
                    className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-medium">#{trade.id}</div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          trade.leg1_state || 'UNKNOWN'
                        )}`}
                      >
                        {trade.leg1_state?.replace(/_/g, ' ') || 'Unknown State'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Token</span>
                        <span>{trade.leg1_crypto_token}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Amount</span>
                        <span>{trade.leg1_crypto_amount}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Created</span>
                        <span className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(trade.created_at))} ago
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <Button
                          variant="outline"
                          className="border-primary-700 text-primary-700 hover:text-primary-800 hover:border-primary-800 w-full"
                        >
                          <Link to={`/trade/${trade.id}`} className="w-full block">
                            Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-primary-700 font-medium">Trade ID</TableHead>
                      <TableHead className="text-primary-700 font-medium">Token</TableHead>
                      <TableHead className="text-primary-700 font-medium">Amount</TableHead>
                      <TableHead className="text-primary-700 font-medium">Status</TableHead>
                      <TableHead className="text-primary-700 font-medium">Created</TableHead>
                      <TableHead className="text-primary-700 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myTrades.map(trade => (
                      <TableRow key={trade.id} className="hover:bg-neutral-50">
                        <TableCell className="font-medium">#{trade.id}</TableCell>
                        <TableCell>{trade.leg1_crypto_token}</TableCell>
                        <TableCell>{trade.leg1_crypto_amount}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              trade.leg1_state || 'UNKNOWN'
                            )}`}
                          >
                            {trade.leg1_state?.replace(/_/g, ' ') || 'Unknown State'}
                          </span>
                        </TableCell>
                        <TableCell className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(trade.created_at))} ago
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="border-primary-700 text-primary-700 hover:text-primary-800 hover:border-primary-800 text-sm px-3 py-1 h-8"
                            >
                              <Link to={`/trade/${trade.id}`}>Details</Link>
                            </Button>
                          </div>
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
                          <PaginationLink isActive={page === i + 1} onClick={() => setPage(i + 1)}>
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
  );
}

export default MyTradesPage;
