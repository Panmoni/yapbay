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
        const sortedTrades = response.data.sort(
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
  }, [account, primaryWallet, page, limit]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'bg-primary-100 text-primary-800';
      case 'AWAITING_FIAT_PAYMENT':
        return 'bg-amber-100 text-amber-800';
      case 'PENDING_CRYPTO_RELEASE':
        return 'bg-secondary-100 text-secondary-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-neutral-100 text-neutral-800';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
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
          <div>
            <CardTitle className="text-primary-800 font-semibold">My Trades</CardTitle>
            <CardDescription>View and manage your active trades</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <p className="text-neutral-500">Loading your trades...</p>
            </div>
          ) : error ? (
            <Alert className="bg-red-50 border-red-200 mb-4">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          ) : myTrades.length === 0 ? (
            <Alert className="bg-neutral-50 border-neutral-200">
              <AlertDescription>You don't have any trades yet.</AlertDescription>
            </Alert>
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
  );
}

export default MyTradesPage;
