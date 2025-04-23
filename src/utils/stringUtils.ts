/**
 * Abbreviates a wallet address by showing only the first and last 4 characters
 * @param address The wallet address to abbreviate
 * @returns The abbreviated address (e.g., "0x1234...5678")
 */
export const abbreviateWallet = (address: string): string => {
  return address.length > 8 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;
};

/**
 * Formats a rate adjustment value as a percentage string with +/- sign
 * @param rate The rate adjustment value (1.0 = no adjustment)
 * @returns Formatted rate string (e.g., "+5.00%", "-3.25%", "0%")
 */
export const formatRate = (rate: number): string => {
  if (rate > 1) return `+${((rate - 1) * 100).toFixed(2)}%`;
  if (rate < 1) return `-${((1 - rate) * 100).toFixed(2)}%`;
  return '0%';
};
