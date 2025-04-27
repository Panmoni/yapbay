// Utility to convert country calling code to flag emoji using external libraries
// Requires: libphonenumber-js, emoji-flags
// Usage: countryCodeToFlag('+1') or countryCodeToFlag('1')

import { getCountryCallingCode, getCountries, CountryCode } from 'libphonenumber-js';
import emojiFlags from 'emoji-flags';

/**
 * Converts a phone country code (e.g., '+1', '1', '+44', '44') to a flag emoji.
 * Returns '' if no flag is found.
 */
export function countryCodeToFlag(code?: string): string {
  if (!code) return '';
  // Remove leading '+' if present
  const clean = code.replace(/^\+/, '');
  // Try to find a matching country for the calling code
  for (const country of getCountries()) {
    const cc = getCountryCallingCode(country as CountryCode);
    if (cc === clean) {
      const flag = emojiFlags.countryCode(country).emoji;
      if (flag) return flag;
    }
  }
  return '';
}

// Note: If a phone number has multiple possible countries (e.g., '1' for US/CA), this returns the first match.
// For more accuracy, consider passing the full phone number and using 'parsePhoneNumber' from libphonenumber-js.
