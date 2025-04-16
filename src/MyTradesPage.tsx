import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Link } from "react-router-dom";
import { getMyTrades, markTradeFiatPaid, Trade, Account } from "./api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Container from "./components/Container";

interface MyTradesPageProps {
  account: Account | null;
}

function MyTradesPage({ account }: MyTradesPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [myTrades, setMyTrades] = useState<Trade[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchMyTrades = async () => {
      if (!account || !primaryWallet) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getMyTrades();
        setMyTrades(
          response.data.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[MyTradesPage] Fetch failed:", err);
        setError(`Failed to load your trades: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTrades();
  }, [account, primaryWallet]);

  const handleMarkPaid = async (tradeId: number) => {
    if (!window.confirm("Are you sure you want to mark this trade as paid?")) {
      return;
    }

    try {
      await markTradeFiatPaid(tradeId);

      // Update the trade status locally
      setMyTrades(trades =>
        trades.map(trade =>
          trade.id === tradeId
            ? {
                ...trade,
                leg1_state: "PENDING_CRYPTO_RELEASE",
                leg1_fiat_paid_at: new Date().toISOString()
              }
            : trade
        )
      );

      setActionSuccess("Trade marked as paid successfully");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to mark trade as paid: ${errorMessage}`);
    }
  };

  const handleReleaseEscrow = async () => {
    if (!window.confirm("Are you sure you want to release the escrow?")) {
      return;
    }

    // This is a placeholder function - you would need to implement the actual escrow release
    // by calling your releaseEscrow API with the appropriate parameters
    try {
      // Example placeholder - you'd need the actual parameters for your escrow
      // await releaseEscrow({
      //   escrow_id: trade.escrow_id,
      //   trade_id: tradeId,
      //   authority: primaryWallet.address,
      //   buyer_token_account: buyerTokenAccount,
      //   arbitrator_token_account: arbitratorTokenAccount
      // });

      alert("This is a placeholder for escrow release. Implement the actual release functionality.");

      // For now, just show a success message
      setActionSuccess("Release function would be called here in a real implementation");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setActionSuccess(null);
      }, 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to release escrow: ${errorMessage}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "bg-blue-100 text-blue-800";
      case "AWAITING_FIAT_PAYMENT":
        return "bg-amber-100 text-amber-800";
      case "PENDING_CRYPTO_RELEASE":
        return "bg-purple-100 text-purple-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-neutral-100 text-neutral-800";
      case "DISPUTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  // Helper to determine if the current user is the buyer in this trade
  const isUserBuyer = (trade: Trade) => {
    return account && trade.leg1_buyer_account_id === account.id;
  };

  // Helper to determine if the current user is the seller in this trade
  const isUserSeller = (trade: Trade) => {
    return account && trade.leg1_seller_account_id === account.id;
  };

  if (!primaryWallet) {
    return (
      <Container>
        <Card>
          <CardHeader>
            <CardTitle className="text-[#5b21b6] font-semibold">My Trades</CardTitle>
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
            <CardTitle className="text-[#5b21b6] font-semibold">My Trades</CardTitle>
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
            <CardTitle className="text-[#5b21b6] font-semibold">My Trades</CardTitle>
            <CardDescription>View and manage your active trades</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-5">
              <Alert variant="destructive" className="mb-0 border-none bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {actionSuccess && (
            <div className="p-5">
              <Alert className="mb-0 bg-[#d1fae5] border-[#a7f3d0]">
                <AlertDescription className="text-[#065f46]">{actionSuccess}</AlertDescription>
              </Alert>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-16">
              <p className="text-neutral-500">Loading your trades...</p>
            </div>
          )}

          {!loading && myTrades.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-neutral-500">You don't have any trades yet.</p>
              <p className="text-neutral-400 text-sm mt-2">
                Visit the <Link to="/" className="text-[#6d28d9] hover:text-[#5b21b6]">home page</Link> to start trading.
              </p>
            </div>
          ) : (
            !loading && (
              <>
                {/* Mobile card view */}
                <div className="md:hidden p-4 space-y-4">
                  {myTrades.map((trade) => (
                    <div key={trade.id} className="mobile-card-view">
                      <div className="mobile-card-view-header">
                        <span>#{trade.id}</span>
                        {isUserBuyer(trade) ? (
                          <Badge className="bg-[#ede9fe] text-[#5b21b6] hover:bg-[#ddd6fe]">Buyer</Badge>
                        ) : (
                          <Badge className="bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]">Seller</Badge>
                        )}
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Token</span>
                        <span>{trade.leg1_crypto_token}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Amount</span>
                        <span>{trade.leg1_crypto_amount}</span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.leg1_state)}`}>
                          {trade.leg1_state.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Created</span>
                        <span className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(trade.created_at))} ago
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        {isUserBuyer(trade) && trade.leg1_state === "AWAITING_FIAT_PAYMENT" && (
                          <Button
                            onClick={() => handleMarkPaid(trade.id)}
                            className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white w-full"
                          >
                            Mark Paid
                          </Button>
                        )}

                        {isUserSeller(trade) && trade.leg1_state === "PENDING_CRYPTO_RELEASE" && (
                          <Button
                            onClick={handleReleaseEscrow}
                            className="bg-[#10b981] hover:bg-[#059669] text-white w-full"
                          >
                            Release
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6] w-full"
                        >
                          <Link to={`/trade/${trade.id}`} className="w-full block">
                            Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                        <TableHead className="text-[#6d28d9] font-medium">Trade ID</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Role</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Token</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Amount</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Status</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Created</TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myTrades.map((trade) => (
                        <TableRow key={trade.id} className="hover:bg-neutral-50">
                          <TableCell className="font-medium">#{trade.id}</TableCell>
                          <TableCell>
                            {isUserBuyer(trade) ? (
                              <Badge className="bg-[#ede9fe] text-[#5b21b6] hover:bg-[#ddd6fe]">Buyer</Badge>
                            ) : (
                              <Badge className="bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]">Seller</Badge>
                            )}
                          </TableCell>
                          <TableCell>{trade.leg1_crypto_token}</TableCell>
                          <TableCell>{trade.leg1_crypto_amount}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.leg1_state)}`}>
                              {trade.leg1_state.replace(/_/g, ' ')}
                            </span>
                          </TableCell>
                          <TableCell className="text-neutral-500 text-sm">
                            {formatDistanceToNow(new Date(trade.created_at))} ago
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {isUserBuyer(trade) && trade.leg1_state === "AWAITING_FIAT_PAYMENT" && (
                                <Button
                                  onClick={() => handleMarkPaid(trade.id)}
                                  className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white text-sm px-3 py-1 h-8"
                                >
                                  Mark Paid
                                </Button>
                              )}

                              {isUserSeller(trade) && trade.leg1_state === "PENDING_CRYPTO_RELEASE" && (
                                <Button
                                  onClick={handleReleaseEscrow}
                                  className="bg-[#10b981] hover:bg-[#059669] text-white text-sm px-3 py-1 h-8"
                                >
                                  Release
                                </Button>
                              )}

                              <Button
                                variant="outline"
                                className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6] text-sm px-3 py-1 h-8"
                              >
                                <Link to={`/trade/${trade.id}`}>
                                  Details
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default MyTradesPage;
