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
                ? "bg-success text-neutral-100"
                : "bg-error text-neutral-100"
            }`}
          >
            {offerType}
          </span>
        </TooltipTrigger>
        <TooltipContent
          className={
            offerType === "BUY"
              ? "bg-success text-neutral-100"
              : "bg-error text-neutral-100"
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
