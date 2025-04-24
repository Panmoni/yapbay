import { parseUnits, formatUnits } from 'viem'; // Import viem utilities

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

/**
 * Utility function to format an amount for display
 * @param amount The amount to format
 * @param decimals The number of decimals
 * @returns The formatted amount
 */
export const formatAmount = (amount: number, decimals: number = 6): string => {
  return formatUnits(parseUnits(amount.toString(), decimals), decimals);
};

/**
 * Parses a time limit object or string into a human-readable string.
 * Handles both { minutes: number } and ISO duration string formats (e.g., "PT60M").
 * @param timeLimit The time limit object or string.
 * @returns A human-readable time limit string (e.g., "60 minutes", "1 hour").
 */
export const parseTimeLimit = (
  timeLimit: { minutes: number } | string | undefined | null
): string => {
  if (!timeLimit) {
    return 'the specified time'; // Default fallback
  }

  if (typeof timeLimit === 'object' && timeLimit !== null && 'minutes' in timeLimit) {
    const minutes = timeLimit.minutes;
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      let result = `${hours} hour${hours !== 1 ? 's' : ''}`;
      if (remainingMinutes > 0) {
        result += ` ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
      }
      return result;
    }
  }

  if (typeof timeLimit === 'string') {
    // Basic parsing for ISO 8601 duration like PT60M, PT1H, PT1H30M
    const match = timeLimit.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes < 60) {
        return `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
      } else {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        let result = `${h} hour${h !== 1 ? 's' : ''}`;
        if (m > 0) {
          result += ` ${m} minute${m !== 1 ? 's' : ''}`;
        }
        return result;
      }
    }
    // Fallback if string format is unexpected
    return timeLimit;
  }

  return 'the specified time'; // Fallback for unknown types
};
