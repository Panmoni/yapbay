// src/types/index.ts
export interface Account {
  id: number;
  wallet_address: string;
  username: string;
  email: string;
  telegram_username?: string;
  telegram_id?: number;
  profile_photo_url?: string;
  phone_country_code?: string;
  phone_number?: string;
  available_from?: string;
  available_to?: string;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: number;
  creator_account_id: number;
  offer_type: 'BUY' | 'SELL';
  token: string;
  fiat_currency: string;
  min_amount: number;
  max_amount: number;
  total_available_amount: number;
  rate_adjustment: number;
  terms?: string;
  escrow_deposit_time_limit: string;
  fiat_payment_time_limit: string;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: number;
  leg1_offer_id: number;
  leg2_offer_id?: number;
  overall_status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  from_fiat_currency: string;
  destination_fiat_currency: string;
  from_bank?: string;
  destination_bank?: string;
  // Add other trade properties based on your schema
}

export interface Escrow {
  id: number;
  trade_id: number;
  escrow_address: string;
  seller_address: string;
  buyer_address: string;
  arbitrator_address: string;
  token_type: string;
  amount: number;
  state: 'CREATED' | 'FUNDED' | 'RELEASED' | 'CANCELLED' | 'DISPUTED' | 'RESOLVED';
  // Add other escrow properties
}