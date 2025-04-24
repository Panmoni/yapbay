// src/utils/timeUtils.ts

/**
 * Helper to extract minutes from a time limit value.
 * Handles both object ({ minutes: number }) and string ("X minutes") formats.
 * Returns a default value if the input is undefined, null, or an unparseable string.
 *
 * @param timeLimit - The time limit value, which can be an object, a string, or undefined.
 * @param defaultMinutes - The default number of minutes to return if parsing fails (defaults to 0).
 * @returns The number of minutes extracted or the default value.
 */
export const getMinutesFromTimeLimit = (
  timeLimit: { minutes: number } | string | undefined,
  defaultMinutes: number = 0 // Default to 0 as per OfferDetailPage logic
): number => {
  if (typeof timeLimit === 'object' && timeLimit !== null && 'minutes' in timeLimit) {
    return timeLimit.minutes;
  }

  if (typeof timeLimit === 'string') {
    const match = timeLimit.match(/^(\d+)\s+minutes?$/i);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  }

  // Return default value if undefined, null, or unparseable string
  return defaultMinutes;
};
