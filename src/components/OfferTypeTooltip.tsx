import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OfferTypeTooltipProps {
  offerType: string;
}

function OfferTypeTooltip({ offerType }: OfferTypeTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              offerType === "BUY"
                ? "bg-secondary-500 text-neutral-100"
                : "bg-amber-500 text-neutral-100"
            }`}
          >
            {offerType}
          </span>
        </TooltipTrigger>
        <TooltipContent
          className={
            offerType === "BUY"
              ? "bg-secondary-200 text-secondary-900"
              : "bg-primary-100 text-primary-800"
          }
        >
          <p>
            {offerType === "BUY"
              ? "You are buying USDC from others"
              : "You are selling USDC to others"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default OfferTypeTooltip;
