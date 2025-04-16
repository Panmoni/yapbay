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
                ? "bg-[#d1fae5] text-[#065f46]"
                : "bg-[#ede9fe] text-[#5b21b6]"
            }`}
          >
            {offerType}
          </span>
        </TooltipTrigger>
        <TooltipContent
          className={
            offerType === "BUY"
              ? "bg-[#d1fae5] text-[#065f46]"
              : "bg-[#ede9fe] text-[#5b21b6]"
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
