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
                ? "bg-secondary-200 text-secondary-900"
                : "bg-[#ede9fe] text-primary-800"
            }`}
          >
            {offerType}
          </span>
        </TooltipTrigger>
        <TooltipContent
          className={
            offerType === "BUY"
              ? "bg-secondary-200 text-secondary-900"
              : "bg-[#ede9fe] text-primary-800"
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
