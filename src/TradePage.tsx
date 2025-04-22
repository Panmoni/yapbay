import { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import {
  getTradeById as getTrade,
  getAccountById,
  getOfferById,
  markTradeFiatPaid,
  recordEscrow,
  releaseEscrow,
  cancelEscrow,
  disputeEscrow,
  Trade,
  Offer,
  Account
} from './api';
import { createEscrowTransaction } from './services/blockchainService';
import { toast } from 'sonner';
import ChatSection from './components/ChatSection';
import ParticipantsSection from "./components/ParticipantsSection";
import TradeDetailsCard from "./components/TradeDetailsCard";
import { useTradeParticipants } from "./hooks/useTradeParticipants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDescription } from '@/components/ui/alert'; // Keep AlertDescription if needed elsewhere, or remove if not
import TradeStatusDisplay from './components/TradeStatusDisplay';
import { useTradeUpdates } from './hooks/useTradeUpdates';


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
 // Remove the error state, sonner handles display
 // const [error, setError] = useState<string | null>(null);
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
     console.log('[TRADE]', trade);
      // Get fresh account data for both buyer and seller
      const buyerId = trade.leg1_buyer_account_id;
      const sellerId = trade.leg1_seller_account_id;
      
      if (!buyerId || !sellerId) {
        throw new Error("Missing buyer or seller account ID in trade data");
      }
      
      // Fetch the latest account data from the API
      const buyerResponse = await getAccountById(buyerId.toString());
      const sellerResponse = await getAccountById(sellerId.toString());
      
      const buyerData = buyerResponse.data;
      const sellerData = sellerResponse.data;
      
      // console.log("[DEBUG] Fresh buyer account data:", buyerData);
      // console.log("[DEBUG] Fresh seller account data:", sellerData);
      
      // Get wallet addresses from the account data
      const buyerAddress = buyerData.wallet_address;
      const sellerAddress = sellerData.wallet_address;
      
      if (!buyerAddress) {
        throw new Error(`Missing buyer wallet address for account ${buyerId} (${buyerData.username})`);
      }
      
      if (!sellerAddress) {
        throw new Error(`Missing seller wallet address for account ${sellerId} (${sellerData.username})`);
      }
      
      // Check if the wallet is an Ethereum wallet
      if (!isEthereumWallet(primaryWallet)) {
        throw new Error("Connected wallet is not an Ethereum wallet");
      }
      
     // Show notification message using toast
     toast('Creating escrow on blockchain...', {
       description: 'Please approve the transaction in your wallet.',
     });

     // Create the escrow transaction on the blockchain
      const txResult = await createEscrowTransaction(
        primaryWallet,
        {
          tradeId: trade.id,
          buyer: buyerAddress,
          amount: parseFloat(trade.leg1_crypto_amount),
          sequential: false,
          sequentialEscrowAddress: undefined
        }
      );
      
      console.log("[DEBUG] Transaction result:", txResult);
      
      // Now notify the backend about the successful transaction
      const recordData = {
        trade_id: trade.id,
        transaction_hash: txResult.txHash,
        escrow_id: txResult.escrowId,
        seller: sellerAddress,
        buyer: buyerAddress,
        amount: parseFloat(trade.leg1_crypto_amount),
        sequential: false
      };
      
      console.log("[DEBUG] Recording escrow with data:", recordData);
      
      try {
        const recordResponse = await recordEscrow(recordData);
        console.log("[DEBUG] Record escrow response:", recordResponse);
      } catch (recordError) {
        console.error("[ERROR] Failed to record escrow:", recordError);
        console.error("[ERROR] Response data:", recordError.response?.data);
        throw recordError;
      }

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
      
     // No need to clear error state manually
   } catch (err) {
     console.error('Error creating escrow:', err);

     // Show error using toast.error
     let errorMessage = 'Failed to create escrow: Unknown error';
     if (err.response?.data?.message) {
       errorMessage = `API Error: ${err.response.data.message}`;
     } else if (err instanceof Error) {
       errorMessage = `Error: ${err.message}`;
     }
     toast.error(errorMessage);
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
     console.error('Error marking fiat as paid:', err);
     toast.error(
       err instanceof Error ? err.message : 'Failed to mark fiat as paid'
     );
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
     console.error('Error releasing crypto:', err);
     toast.error(
       err instanceof Error ? err.message : 'Failed to release crypto'
     );
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
     console.error('Error disputing trade:', err);
     toast.error(
       err instanceof Error ? err.message : 'Failed to dispute trade'
     );
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
     console.error('Error cancelling trade:', err);
     toast.error(
       err instanceof Error ? err.message : 'Failed to cancel trade'
     );
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
       // No need to clear error state
     } catch (err) {
       const errorMessage =
         err instanceof Error ? err.message : 'Unknown error';
       toast.error(`Failed to load trade details: ${errorMessage}`);
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

 // Remove the error Alert display block
 // if (error) { ... }

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
      <div className="bg-primary-100 p-3 rounded-md mb-4 text-center">
        <p className="text-primary-800 font-medium">
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
      <Card className="border border-neutral-200 shadow-sm p-4">
        <CardHeader>
          <CardTitle className="text-primary-800">Trade Status</CardTitle>
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
          className="bg-primary-700 hover:bg-primary-800 text-white"
        >
          View All My Trades
        </Button>
      </div>
    </div>
  );
}

export default TradePage;
