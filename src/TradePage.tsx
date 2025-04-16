import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  getTradeById as getTrade,
  getAccountById,
  getOfferById,
  markTradeFiatPaid,
  createEscrow,
  releaseEscrow,
  cancelEscrow,
  disputeEscrow,
  Trade,
  Offer,
  Account
} from "./api";
import ChatSection from "./components/ChatSection";
import ParticipantsSection from "./components/ParticipantsSection";
import TradeDetailsCard from "./components/TradeDetailsCard";
import { useTradeParticipants } from "./hooks/useTradeParticipants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TradeStatusDisplay from "./components/TradeStatusDisplay";
import { useTradeUpdates } from "./hooks/useTradeUpdates";


function TradePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { primaryWallet } = useDynamicContext();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [creator, setCreator] = useState<Account | null>(null);
  const [buyerAccount, setBuyerAccount] = useState<Account | null>(null);
  const [sellerAccount, setSellerAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Use our custom hook to determine user role, current account, and counterparty
  const { userRole, currentAccount, counterparty } = useTradeParticipants(trade);

  // Use polling to get trade updates
  const { trade: tradeUpdates } = useTradeUpdates(id ? parseInt(id) : 0);

  // Update trade data when we receive updates via polling
  useEffect(() => {
    if (tradeUpdates) {
      setTrade(tradeUpdates);
      console.log(`Trade updated - Current state: ${tradeUpdates.leg1_state}, User role: ${userRole}`);

      // No need to update user role manually - the useUserRole hook handles this automatically
      // when the trade state changes
    }
  }, [tradeUpdates, userRole]);

  // Action handlers for trade status actions
  const handleCreateEscrow = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Determine buyer and seller addresses
      const sellerAddress = userRole === 'seller' ? primaryWallet.address : counterparty?.wallet_address;
      const buyerAddress = userRole === 'buyer' ? primaryWallet.address : counterparty?.wallet_address;

      if (!sellerAddress || !buyerAddress) {
        throw new Error("Missing wallet addresses");
      }

      // Call API to create escrow
      await createEscrow({
        trade_id: trade.id,
        escrow_id: trade.id, // Using trade ID as escrow ID for simplicity
        seller: sellerAddress,
        buyer: buyerAddress,
        amount: parseFloat(trade.leg1_crypto_amount)
      });

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error creating escrow:", err);
      setError(err instanceof Error ? err.message : "Failed to create escrow");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkFiatPaid = async () => {
    if (!trade) return;

    setActionLoading(true);
    try {
      // Call API to mark fiat as paid
      await markTradeFiatPaid(trade.id);

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error marking fiat as paid:", err);
      setError(err instanceof Error ? err.message : "Failed to mark fiat as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseCrypto = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Call API to release escrow
      // Note: This is a simplified version, in a real implementation you would need to provide
      // all the required parameters like buyer_token_account and arbitrator_token_account
      await releaseEscrow({
        escrow_id: trade.id,
        trade_id: trade.id,
        authority: primaryWallet.address,
        buyer_token_account: "placeholder", // This would come from the wallet
        arbitrator_token_account: "placeholder" // This would be a system account
      });

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error releasing crypto:", err);
      setError(err instanceof Error ? err.message : "Failed to release crypto");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeTrade = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Call API to dispute escrow
      await disputeEscrow({
        escrow_id: trade.id,
        trade_id: trade.id,
        disputing_party: primaryWallet.address,
        disputing_party_token_account: "placeholder" // This would come from the wallet
      });

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error disputing trade:", err);
      setError(err instanceof Error ? err.message : "Failed to dispute trade");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTrade = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Call API to cancel escrow
      await cancelEscrow({
        escrow_id: trade.id,
        trade_id: trade.id,
        seller: userRole === 'seller' ? primaryWallet.address : counterparty?.wallet_address || "",
        authority: primaryWallet.address
      });

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error cancelling trade:", err);
      setError(err instanceof Error ? err.message : "Failed to cancel trade");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const fetchTradeDetails = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch trade details
        const tradeResponse = await getTrade(parseInt(id));
        const tradeData = tradeResponse.data;
        setTrade(tradeData);

        // Fetch related offer
        if (tradeData.leg1_offer_id) {
          const offerResponse = await getOfferById(tradeData.leg1_offer_id);
          setOffer(offerResponse.data);

          // Fetch creator account
          const creatorResponse = await getAccountById(offerResponse.data.creator_account_id);
          setCreator(creatorResponse.data);

          console.log("[DEBUG] Offer creator ID:", offerResponse.data.creator_account_id);
          console.log("[DEBUG] Trade buyer ID:", tradeData.leg1_buyer_account_id);
          console.log("[DEBUG] Trade seller ID:", tradeData.leg1_seller_account_id);

          // Fetch buyer account
          if (tradeData.leg1_buyer_account_id) {
            const buyerResponse = await getAccountById(tradeData.leg1_buyer_account_id);
            setBuyerAccount(buyerResponse.data);
            console.log("[DEBUG] Fetched buyer account:", buyerResponse.data);
          }

          // Fetch seller account
          if (tradeData.leg1_seller_account_id) {
            const sellerResponse = await getAccountById(tradeData.leg1_seller_account_id);
            setSellerAccount(sellerResponse.data);
            console.log("[DEBUG] Fetched seller account:", sellerResponse.data);
          }

          // No need to manually determine user role - the useUserRole hook handles this
          console.log(`Trade state: ${tradeData.leg1_state}`);
        }

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load trade details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeDetails();
  }, [id]); // No need for getUserRoleInTrade dependency

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <p className="text-neutral-500">Loading trade details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4 border-none bg-red-50">
        <AlertDescription className="text-red-700">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!trade) {
    return (
      <Alert className="mb-4 border-yellow-300 bg-yellow-50">
        <AlertDescription className="text-primary-700">
          Trade not found or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* User Role Display */}
      <div className="bg-purple-100 p-3 rounded-md mb-4 text-center">
        <p className="text-purple-800 font-medium">
          Your role in this trade: <span className="font-bold uppercase">{userRole}</span>
        </p>
      </div>

      {/* Trade Details */}
      {trade && offer && (
        <TradeDetailsCard
          trade={trade}
          offer={offer}
          userRole={userRole}
          counterparty={counterparty}
        />
      )}

      {/* Enhanced Status Display */}
      <Card className="border border-gray-200 shadow-sm p-4">
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Trade Status</CardTitle>
          <CardDescription>Current status and progress of this trade</CardDescription>
        </CardHeader>
        <CardContent>
          <TradeStatusDisplay
            trade={trade}
            userRole={userRole}
            onCreateEscrow={handleCreateEscrow}
            onMarkFiatPaid={handleMarkFiatPaid}
            onReleaseCrypto={handleReleaseCrypto}
            onDisputeTrade={handleDisputeTrade}
            onCancelTrade={handleCancelTrade}
            loading={actionLoading}
          />
        </CardContent>
      </Card>

      {/* Chat Section */}
      <ChatSection counterparty={counterparty} />

      {/* Participants */}
      <ParticipantsSection
        buyerAccount={buyerAccount}
        sellerAccount={sellerAccount}
        currentAccount={currentAccount}
        creator={creator}
        trade={trade}
        userRole={userRole}
      />

      {/* Navigation Buttons */}
      <div className="flex justify-end p-4">
        <Button
          onClick={() => navigate("/trades")}
          className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white"
        >
          View All My Trades
        </Button>
      </div>
    </div>
  );
}

export default TradePage;
