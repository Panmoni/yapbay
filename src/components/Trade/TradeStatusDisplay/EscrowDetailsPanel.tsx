import { useState } from 'react';
import { useEscrowDetails, getEscrowStateName, EscrowState } from '@/hooks/useEscrowDetails';
import { checkAndFundEscrow } from '@/services/chainService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, ChevronUp, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EscrowDetailsPanelProps {
  escrowAddress: string;
  trade: { id: number };
  userRole: 'buyer' | 'seller';
}

export function EscrowDetailsPanel({ escrowAddress, userRole }: EscrowDetailsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { primaryWallet } = useDynamicContext();

  const { escrowDetails, loading, error, balance, lastUpdated, isRefreshing, refresh } =
    useEscrowDetails(escrowAddress);

  const handleFundEscrow = async () => {
    if (!primaryWallet || !escrowAddress || !escrowDetails) return;

    setActionLoading(true);
    try {
      toast.info('Funding escrow on Solana...', {
        description: 'Please approve the transaction in your wallet.',
      });

      await checkAndFundEscrow(primaryWallet, escrowAddress);

      toast.success('Escrow funded successfully!');
      await refresh(); // Refresh escrow details
    } catch (err) {
      console.error('Error funding escrow:', err);
      toast.error(`Escrow Funding Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Determine if the escrow needs funding
  const needsFunding =
    escrowDetails &&
    (typeof escrowDetails.state === 'number'
      ? escrowDetails.state === EscrowState.CREATED
      : escrowDetails.state === 'CREATED') &&
    parseFloat(balance) === 0;

  // Only show fund button for seller
  const showFundButton = userRole === 'seller' && needsFunding;

  // Get Solana explorer URL for the network
  const getSolanaExplorerUrl = (address: string) => {
    // Using Solana devnet explorer
    return `https://explorer.solana.com/address/${address}?cluster=devnet`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: unknown) => {
    if (!timestamp || timestamp.toString() === '0') return 'Not set';

    // Convert BN to number if needed
    const timestampNumber =
      typeof timestamp === 'object' && timestamp && 'toNumber' in timestamp
        ? (timestamp as { toNumber: () => number }).toNumber()
        : Number(timestamp);

    const date = new Date(timestampNumber * 1000);
    return date.toLocaleString();
  };

  // Get state badge color
  const getStateBadgeColor = (state: EscrowState | string) => {
    const stateStr = typeof state === 'string' ? state : EscrowState[state];
    switch (stateStr) {
      case 'CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'FUNDED':
        return 'bg-green-100 text-green-800';
      case 'RELEASED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'DISPUTED':
        return 'bg-orange-100 text-orange-800';
      case 'RESOLVED':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address || address === '11111111111111111111111111111111') return 'None'; // Solana system program
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };

  // Format amount for display
  const formatAmount = (amount: unknown) => {
    if (!amount) return '0';

    // Convert BN to number if needed
    const amountNumber =
      typeof amount === 'object' && amount && 'toNumber' in amount
        ? (amount as { toNumber: () => number }).toNumber()
        : Number(amount);

    return (amountNumber / 1_000_000).toFixed(6); // USDC has 6 decimals
  };

  return (
    <TooltipProvider>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full border rounded-md p-2 mt-4 bg-white"
      >
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 font-medium">
              <span>Escrow Details (Solana On-Chain)</span>
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

            <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>

        <CollapsibleContent className="pt-4">
          {loading && !escrowDetails ? (
            <div className="py-4 text-center">Loading escrow details...</div>
          ) : error ? (
            <div className="py-4 text-center text-red-500">
              Error loading escrow details: {error.message}
            </div>
          ) : escrowDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-neutral-50 p-3 rounded md:col-span-2">
                  <div className="text-sm text-neutral-500">Escrow Address (PDA)</div>
                  <div className="font-medium flex items-center gap-1">
                    <span className="truncate">{formatAddress(escrowAddress)}</span>
                    <a
                      href={getSolanaExplorerUrl(escrowAddress)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Escrow ID</div>
                  <div className="font-medium">{escrowDetails.escrowId.toString()}</div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Trade ID</div>
                  <div className="font-medium">{escrowDetails.tradeId.toString()}</div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">State</div>
                  <div className="font-medium">
                    <Badge className={getStateBadgeColor(escrowDetails.state)}>
                      {typeof escrowDetails.state === 'string'
                        ? escrowDetails.state
                        : getEscrowStateName(Number(escrowDetails.state))}
                    </Badge>
                  </div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Amount</div>
                  <div className="font-medium">{formatAmount(escrowDetails.amount)} USDC</div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Current Balance</div>
                  <div className="font-medium">{balance} USDC</div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Fiat Paid</div>
                  <div className="font-medium">{escrowDetails.fiatPaid ? 'Yes' : 'No'}</div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Deposit Deadline</div>
                  <div className="font-medium">
                    {formatTimestamp(escrowDetails.depositDeadline)}
                  </div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Fiat Deadline</div>
                  <div className="font-medium">{formatTimestamp(escrowDetails.fiatDeadline)}</div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Seller</div>
                  <div className="font-medium flex items-center gap-1">
                    <span className="truncate">{formatAddress(escrowDetails.seller)}</span>
                    <a
                      href={getSolanaExplorerUrl(escrowDetails.seller)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Buyer</div>
                  <div className="font-medium flex items-center gap-1">
                    <span className="truncate">{formatAddress(escrowDetails.buyer)}</span>
                    <a
                      href={getSolanaExplorerUrl(escrowDetails.buyer)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Arbitrator</div>
                  <div className="font-medium flex items-center gap-1">
                    <span className="truncate">{formatAddress(escrowDetails.arbitrator)}</span>
                    <a
                      href={getSolanaExplorerUrl(escrowDetails.arbitrator)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
                <div className="bg-neutral-50 p-3 rounded">
                  <div className="text-sm text-neutral-500">Sequential</div>
                  <div className="font-medium">{escrowDetails.sequential ? 'Yes' : 'No'}</div>
                </div>
              </div>

              {showFundButton && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-amber-800 mb-3">
                    <strong>Action Required:</strong> This escrow has been created but not yet
                    funded. You need to fund it to proceed with the trade.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleFundEscrow}
                      disabled={actionLoading}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {actionLoading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw size={16} className="animate-spin" />
                          Funding...
                        </span>
                      ) : (
                        'Fund Escrow Now'
                      )}
                    </Button>
                    <p className="text-xs text-neutral-600">
                      This will fund the escrow on the Solana blockchain.
                    </p>
                  </div>
                </div>
              )}

              {(typeof escrowDetails.state === 'number'
                ? escrowDetails.state === EscrowState.CREATED
                : escrowDetails.state === 'CREATED') &&
                parseFloat(balance) > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-800">
                      <strong>Note:</strong> The escrow has a balance but is still in CREATED state.
                      This may indicate a pending transaction or a blockchain synchronization delay.
                    </p>
                  </div>
                )}
            </div>
          ) : (
            <div className="py-4 text-center">No escrow details found</div>
          )}
          <div className="mt-4 text-xs text-neutral-600 text-center">
            Escrow data automatically updates every minute via Solana RPC.
          </div>
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  );
}
