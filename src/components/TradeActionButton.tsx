import React from "react";
import { Button } from "@/components/ui/button";

export type TradeAction =
  | 'create_escrow'
  | 'fund_escrow'
  | 'mark_paid'
  | 'release'
  | 'dispute'
  | 'cancel';

interface TradeActionButtonProps {
  action: TradeAction;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const TradeActionButton: React.FC<TradeActionButtonProps> = ({
  action,
  onClick,
  disabled = false,
  loading = false,
}) => {
  // Define button configurations for each action type
  const buttonConfig: Record<TradeAction, {
    label: string;
    variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    icon?: React.ReactNode;
  }> = {
    create_escrow: {
      label: "Create Escrow",
      variant: "default",
      icon: (
        <svg fill="#ffffff"viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zM9.51 11.744l6.376-3.668 6.36 3.676-6.36 3.677-6.375-3.685zm12.976-.13l3.257-1.9L15.886 4 6 9.714v11.429l9.886 5.714 9.857-5.714-3.495-2.038-6.362 3.676-6.39-3.676v-3.296l6.4 3.696 6.418-3.715v3.315l3.457 2.038V9.714l-3.285 1.9z"/></svg>
      ),
    },
    fund_escrow: {
      label: "Fund Escrow",
      variant: "default",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
          <path d="M12 18V6" />
        </svg>
      ),
    },
    mark_paid: {
      label: "Mark Fiat as Paid",
      variant: "default",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ),
    },
    release: {
      label: "Release Crypto",
      variant: "default",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
      ),
    },
    dispute: {
      label: "Dispute Trade",
      variant: "destructive",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="m9 3 9 9-9 9-9-9Z" />
        </svg>
      ),
    },
    cancel: {
      label: "Cancel Trade",
      variant: "outline",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      ),
    },
  };

  const { label, variant, icon } = buttonConfig[action];

  return (
    <Button
      variant={variant}
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center bg-primary-600 text-white hover:bg-primary-800 focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 transition duration-150 ease-in-out"
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon
      )}
      {label}
    </Button>
  );
};

export default TradeActionButton;
