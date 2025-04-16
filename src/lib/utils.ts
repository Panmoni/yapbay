import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number with commas for thousands
 * @param value The number to format
 * @returns Formatted string with commas
 */
export function formatNumber(value: number | string): string {
  // Convert to number if it's a string
  const num = typeof value === 'string' ? parseFloat(value) : value;

  // Return empty string if not a valid number
  if (isNaN(num)) return '';

  // Format with commas
  return num.toLocaleString('en-US');
}
