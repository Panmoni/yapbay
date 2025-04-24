/**
 * Utility function to handle API errors consistently
 * @param error The error object from a try/catch block
 * @param defaultMessage Default message to show if error cannot be parsed
 * @returns A formatted error message string
 */
export function handleApiError(error: unknown, defaultMessage: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data
  ) {
    return `API Error: ${error.response.data.message}`;
  } else if (error instanceof Error) {
    return `Error: ${error.message}`;
  }
  return defaultMessage;
}
