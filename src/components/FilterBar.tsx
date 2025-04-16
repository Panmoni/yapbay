import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CurrencyOptions } from "@/lib/currencyOptions";

interface FilterBarProps {
  onCurrencyChange: (currency: string) => void;
  onTradeTypeChange?: (tradeType: string) => void;
}

const FilterBar = ({ onCurrencyChange, onTradeTypeChange }: FilterBarProps) => {
  const [currency, setCurrency] = useState<string>("ALL");
  const [tradeType, setTradeType] = useState<string>("ALL");

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    onCurrencyChange(value);
  };

  const handleTradeTypeChange = (value: string) => {
    setTradeType(value);
    if (onTradeTypeChange) {
      onTradeTypeChange(value);
    }
  };

  const clearFilters = () => {
    setCurrency("ALL");
    setTradeType("ALL");
    onCurrencyChange("ALL");
    if (onTradeTypeChange) {
      onTradeTypeChange("ALL");
    }
  };

  return (
    <div className="flex flex-wrap justify-end items-center gap-3">
      <div className="w-auto">
        <Select value={tradeType} onValueChange={handleTradeTypeChange}>
          <SelectTrigger className="w-full sm:w-[200px] border-neutral-300 focus:ring-[#8b5cf6]">
            <SelectValue placeholder="I want to..." />
          </SelectTrigger>
          <SelectContent className="bg-neutral-100">
            <SelectItem value="ALL">All offers</SelectItem>
            <SelectItem value="BUY">I am buying USDC</SelectItem>
            <SelectItem value="SELL">I am selling USDC</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-auto">
        <Select value={currency} onValueChange={handleCurrencyChange}>
          <SelectTrigger className="w-full sm:w-[200px] border-neutral-300 focus:ring-[#8b5cf6]">
            <SelectValue placeholder="Filter by currency" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-100">
            <SelectItem value="ALL">All Currencies</SelectItem>
            <CurrencyOptions />
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={clearFilters}
        variant="ghost"
        size="sm"
        title="Clear filters"
        className="m-0 p-0 text-xs text-neutral-500 hover:text-[#5b21b6] hover:bg-purple-50"
      >
        x
      </Button>
    </div>
  );
};

export default FilterBar;
