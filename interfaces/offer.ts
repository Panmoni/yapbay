export interface Offer {
  id: string;
  owner: string;
  totalTradesAccepted: string;
  totalTradesCompleted: string;
  disputesInvolved: string;
  disputesLost: string;
  averageTradeVolume: string;
  minTradeAmount: string;
  maxTradeAmount: string;
  fiatCurrency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  buyingCrypto: boolean;
  country: string;
  paymentMethod: string;
  terms: string;
  rate: string;
  title: string;
}
