import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface TradeHeaderProps {
  userRole: string;
}

/**
 * Header component for the trade page that displays the user's role
 */
export function TradeHeader({ userRole }: TradeHeaderProps) {
  return (
    <div className="bg-primary-100 p-3 rounded-md mb-4 text-center">
      <p className="text-primary-800 font-medium">
        Your role in this trade: <span className="font-bold uppercase">{userRole}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 inline-block cursor-pointer text-primary-500 hover:text-primary-600">
                <Info size={16} />
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-secondary-100 text-primary-800">
              <p>
                {userRole.toLowerCase() === 'buyer'
                  ? 'As the buyer, you’ll wait until the seller fully funds the on-chain escrow, then complete your fiat payment and, finally, await crypto release.'
                  : 'As the seller, you’ll create and fund the on-chain escrow with USDC to kick off the trade, then await buyer’s fiat payment before releasing escrow.'}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </p>
    </div>
  );
}
