import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Link } from 'react-router-dom';
import { getMyEscrows, Escrow, Account } from '@/api';
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
import { Badge } from '@/components/ui/badge';
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

interface ExtendedEscrow extends Escrow {
  uniqueKey: string;
}

interface MyEscrowsPageProps {
  account: Account | null;
}

function MyEscrowsPage({ account }: MyEscrowsPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [myEscrows, setMyEscrows] = useState<ExtendedEscrow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<string>('ALL');
  const limit = 10; // Number of escrows per page

  useEffect(() => {
    const fetchMyEscrows = async () => {
      if (!account || !primaryWallet) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getMyEscrows();
        let escrows = response.data.map(escrow => ({
          ...escrow,
          // Generate a unique key combining onchain_escrow_id and escrow_address
          uniqueKey: escrow.onchain_escrow_id
            ? `${escrow.onchain_escrow_id}-${escrow.escrow_address}`
            : escrow.escrow_address,
        }));
        
        // Apply state filter if not ALL
        if (filter !== 'ALL') {
          escrows = escrows.filter(escrow => escrow.state === filter);
        }
        
        const sortedEscrows = escrows.sort((a, b) => {
          // Handle null cases by putting them at the end
          if (a.onchain_escrow_id === null) return 1;
          if (b.onchain_escrow_id === null) return -1;
          // Convert string IDs to numbers for comparison
          const aId = Number(a.onchain_escrow_id);
          const bId = Number(b.onchain_escrow_id);
          return bId - aId; // Sort descending
        });
        
        // Set total count for pagination
        setTotalCount(sortedEscrows.length);
        
        // Apply pagination to the sorted escrows
        const paginatedEscrows = sortedEscrows.slice((page - 1) * limit, page * limit);
        setMyEscrows(paginatedEscrows);
        
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[MyEscrowsPage] Fetch failed:', err);
        setError(`Failed to load your escrows: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEscrows();
  }, [account, primaryWallet, page, limit, filter]);

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

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'CREATED':
        return 'bg-primary-100 text-primary-800';
      case 'FUNDED':
        return 'bg-amber-100 text-amber-800';
      case 'RELEASED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-neutral-100 text-neutral-800';
      case 'DISPUTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-neutral-100 text-neutral-800';
    }
  };

  const isUserSeller = (escrow: Escrow) => {
    return (
      primaryWallet && escrow.seller_address.toLowerCase() === primaryWallet.address.toLowerCase()
    );
  };

  const isUserBuyer = (escrow: Escrow) => {
    return (
      primaryWallet && escrow.buyer_address.toLowerCase() === primaryWallet.address.toLowerCase()
    );
  };

  if (!primaryWallet) {
    return (
      <Container>
        <Card>
          <CardHeader>
            <CardTitle className="text-primary-800 font-semibold">My Escrows</CardTitle>
            <CardDescription>View your escrow contracts</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-neutral-50 border-neutral-200">
              <AlertDescription>Please connect your wallet to view your escrows.</AlertDescription>
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
            <CardTitle className="text-primary-800 font-semibold">My Escrows</CardTitle>
            <CardDescription>View your escrow contracts</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-700">
                Please create an account first to view your escrows.
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
              <CardTitle className="text-primary-800 font-semibold">My Escrows</CardTitle>
              <CardDescription>View and manage your escrows</CardDescription>
            </div>
            <div className="w-full sm:w-auto">
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full sm:w-[250px] border-neutral-300 focus:ring-primary-500">
                  <SelectValue placeholder="Filter by state" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-100">
                  <SelectItem value="ALL">All States</SelectItem>
                  <SelectItem value="CREATED">Created</SelectItem>
                  <SelectItem value="FUNDED">Funded</SelectItem>
                  <SelectItem value="RELEASED">Released</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
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
          ) : myEscrows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-500 mb-4">You don't have any escrows yet.</p>
              <Button asChild>
                <Link to="/offers">Find Offers</Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden space-y-4">
                {myEscrows.map(escrow => (
                  <div
                    key={escrow.uniqueKey}
                    className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="font-medium">
                        Escrow #{escrow.onchain_escrow_id || 'Pending'}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          escrow.state
                        )}`}
                      >
                        {escrow.state}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Trade ID</span>
                        <span>#{escrow.trade_id}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Role</span>
                        {isUserSeller(escrow) ? (
                          <Badge className="bg-secondary-200 text-secondary-900 hover:bg-secondary-300">
                            Seller
                          </Badge>
                        ) : isUserBuyer(escrow) ? (
                          <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-200">
                            Buyer
                          </Badge>
                        ) : (
                          <Badge className="bg-neutral-100 text-neutral-800">Observer</Badge>
                        )}
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Token</span>
                        <span>{escrow.token_type}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Amount</span>
                        <span>{escrow.amount}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Created</span>
                        <span className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(escrow.created_at))} ago
                        </span>
                      </div>

                      <div className="mt-4">
                        <Link to={`/trade/${escrow.trade_id}`}>
                          <Button
                            variant="outline"
                            className="border-primary-700 text-primary-700 hover:text-primary-800 hover:border-primary-800 w-full"
                          >
                            View Trade
                          </Button>
                        </Link>
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
                      <TableHead className="text-primary-700 font-medium">On-chain ID</TableHead>
                      <TableHead className="text-primary-700 font-medium">Trade ID</TableHead>
                      <TableHead className="text-primary-700 font-medium">Role</TableHead>
                      <TableHead className="text-primary-700 font-medium">Token</TableHead>
                      <TableHead className="text-primary-700 font-medium">Amount</TableHead>
                      <TableHead className="text-primary-700 font-medium">State</TableHead>
                      <TableHead className="text-primary-700 font-medium">Created</TableHead>
                      <TableHead className="text-primary-700 font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myEscrows.map(escrow => (
                      <TableRow key={escrow.uniqueKey} className="hover:bg-neutral-50">
                        <TableCell className="font-medium">
                          {escrow.onchain_escrow_id || '-'}
                        </TableCell>
                        <TableCell className="font-medium">#{escrow.trade_id}</TableCell>
                        <TableCell>
                          {isUserSeller(escrow) ? (
                            <Badge className="bg-secondary-200 text-secondary-900 hover:bg-secondary-300">
                              Seller
                            </Badge>
                          ) : isUserBuyer(escrow) ? (
                            <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-200">
                              Buyer
                            </Badge>
                          ) : (
                            <Badge className="bg-neutral-100 text-neutral-800">Observer</Badge>
                          )}
                        </TableCell>
                        <TableCell>{escrow.token_type}</TableCell>
                        <TableCell>{escrow.amount}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              escrow.state
                            )}`}
                          >
                            {escrow.state}
                          </span>
                        </TableCell>
                        <TableCell className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(escrow.created_at))} ago
                        </TableCell>
                        <TableCell>
                          <Link to={`/trade/${escrow.trade_id}`}>
                            <Button
                              variant="outline"
                              className="border-primary-700 text-primary-700 hover:text-primary-800 hover:border-primary-800 text-sm px-3 py-1 h-8"
                            >
                              View Trade
                            </Button>
                          </Link>
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

export default MyEscrowsPage;
