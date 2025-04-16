import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getMyEscrows, Escrow, Account } from "./api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Container from "./components/Container";

interface MyEscrowsPageProps {
  account: Account | null;
}

function MyEscrowsPage({ account }: MyEscrowsPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [myEscrows, setMyEscrows] = useState<Escrow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyEscrows = async () => {
      if (!account || !primaryWallet) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getMyEscrows();
        setMyEscrows(
          response.data.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        );
        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("[MyEscrowsPage] Fetch failed:", err);
        setError(`Failed to load your escrows: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMyEscrows();
  }, [account, primaryWallet]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "bg-blue-100 text-blue-800";
      case "FUNDED":
        return "bg-amber-100 text-amber-800";
      case "RELEASED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-neutral-100 text-neutral-800";
      case "DISPUTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };

  const isUserSeller = (escrow: Escrow) => {
    return (
      primaryWallet &&
      escrow.seller_address.toLowerCase() ===
        primaryWallet.address.toLowerCase()
    );
  };

  const isUserBuyer = (escrow: Escrow) => {
    return (
      primaryWallet &&
      escrow.buyer_address.toLowerCase() === primaryWallet.address.toLowerCase()
    );
  };

  const abbreviateAddress = (address: string) => {
    return address
      ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      : "";
  };

  if (!primaryWallet) {
    return (
      <Container>
        <Card>
          <CardHeader>
            <CardTitle className="text-[#5b21b6] font-semibold">
              My Escrows
            </CardTitle>
            <CardDescription>View your escrow contracts</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-neutral-50 border-neutral-200">
              <AlertDescription>
                Please connect your wallet to view your escrows.
              </AlertDescription>
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
            <CardTitle className="text-[#5b21b6] font-semibold">
              My Escrows
            </CardTitle>
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
          <div>
            <CardTitle className="text-[#5b21b6] font-semibold">
              My Escrows
            </CardTitle>
            <CardDescription>View your escrow contracts</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="p-5">
              <Alert
                variant="destructive"
                className="mb-0 border-none bg-red-50"
              >
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {loading && (
            <div className="flex justify-center items-center py-16">
              <p className="text-neutral-500">Loading your escrows...</p>
            </div>
          )}

          {!loading && myEscrows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-neutral-500">
                You don't have any escrows yet.
              </p>
              <p className="text-neutral-400 text-sm mt-2">
                Escrows are created when you start a trade.
              </p>
            </div>
          ) : (
            !loading && (
              <>
                {/* Mobile card view */}
                <div className="md:hidden p-4 space-y-4">
                  {myEscrows.map((escrow) => (
                    <div key={escrow.escrow_address} className="mobile-card-view">
                      <div className="mobile-card-view-header">
                        <span>Trade #{escrow.trade_id}</span>
                        {isUserSeller(escrow) ? (
                          <Badge className="bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]">
                            Seller
                          </Badge>
                        ) : isUserBuyer(escrow) ? (
                          <Badge className="bg-[#ede9fe] text-[#5b21b6] hover:bg-[#ddd6fe]">
                            Buyer
                          </Badge>
                        ) : (
                          <Badge className="bg-neutral-100 text-neutral-800">
                            Observer
                          </Badge>
                        )}
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Escrow Address</span>
                        <a
                          href={`https://explorer.solana.com/address/${escrow.escrow_address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6d28d9] hover:text-[#5b21b6] font-mono text-xs"
                        >
                          {abbreviateAddress(escrow.escrow_address)}
                        </a>
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
                        <span className="mobile-card-view-label">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          escrow.status
                        )}`}>
                          {escrow.status}
                        </span>
                      </div>

                      <div className="mobile-card-view-row">
                        <span className="mobile-card-view-label">Created</span>
                        <span className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(escrow.created_at))} ago
                        </span>
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6] w-full"
                        >
                          View Trade
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
                        <TableHead className="text-[#6d28d9] font-medium">
                          Trade ID
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Role
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Escrow Address
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Token
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Amount
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Status
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Created
                        </TableHead>
                        <TableHead className="text-[#6d28d9] font-medium">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myEscrows.map((escrow) => (
                        <TableRow
                          key={escrow.escrow_address}
                          className="hover:bg-neutral-50"
                        >
                          <TableCell className="font-medium">
                            #{escrow.trade_id}
                          </TableCell>
                          <TableCell>
                            {isUserSeller(escrow) ? (
                              <Badge className="bg-[#d1fae5] text-[#065f46] hover:bg-[#a7f3d0]">
                                Seller
                              </Badge>
                            ) : isUserBuyer(escrow) ? (
                              <Badge className="bg-[#ede9fe] text-[#5b21b6] hover:bg-[#ddd6fe]">
                                Buyer
                              </Badge>
                            ) : (
                              <Badge className="bg-neutral-100 text-neutral-800">
                                Observer
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            <a
                              href={`https://explorer.solana.com/address/${escrow.escrow_address}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#6d28d9] hover:text-[#5b21b6]"
                            >
                              {abbreviateAddress(escrow.escrow_address)}
                            </a>
                          </TableCell>
                          <TableCell>{escrow.token_type}</TableCell>
                          <TableCell>{escrow.amount}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                escrow.status
                              )}`}
                            >
                              {escrow.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-neutral-500 text-sm">
                            {formatDistanceToNow(new Date(escrow.created_at))} ago
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6] text-sm px-3 py-1 h-8"
                            >
                              View Trade
                            </Button>
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

export default MyEscrowsPage;
