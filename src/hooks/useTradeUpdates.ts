import { useCallback, useRef } from 'react';
import { Trade } from '@/api';
import { useSmartPolling } from './useSmartPolling';

export function useTradeUpdates(tradeId: number, apiUrl?: string) {
  // Keep track of the previous data and ETag
  const previousDataRef = useRef<Trade | null>(null);
  const etagRef = useRef<string | null>(null);

  // Memoize fetch function to avoid recreating it on each render
  const fetchTrade = useCallback(async (): Promise<Trade | null> => {
    if (!tradeId) return null;

    const baseUrl = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found');
    }

    // Add headers for conditional requests
    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    };

    // Add If-None-Match header if we have an ETag
    if (etagRef.current) {
      headers['If-None-Match'] = etagRef.current;
    }

    // Add If-Modified-Since header if we have previous data
    if (previousDataRef.current?.updated_at) {
      headers['If-Modified-Since'] = new Date(previousDataRef.current.updated_at).toUTCString();
    }

    try {
      console.log(
        `[useTradeUpdates] Fetching trade ${tradeId} with conditional headers:`,
        etagRef.current ? `ETag: ${etagRef.current.substring(0, 10)}...` : 'No ETag',
        previousDataRef.current?.updated_at
          ? `If-Modified-Since: ${new Date(previousDataRef.current.updated_at).toUTCString()}`
          : 'No If-Modified-Since'
      );

      const response = await fetch(`${baseUrl}/trades/${tradeId}`, { headers });

      // Store the new ETag if present
      const newEtag = response.headers.get('ETag');
      if (newEtag) {
        etagRef.current = newEtag;
      }

      // Handle 304 Not Modified
      if (response.status === 304) {
        console.log(`[useTradeUpdates] Received 304 Not Modified for trade ${tradeId}`);
        // Return the previous data since nothing has changed
        return previousDataRef.current;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch trade: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract trade object from response - handle both old and new API response formats
      const tradeData = data.trade || data;

      // Validate that we have a proper trade object
      if (!tradeData || typeof tradeData !== 'object') {
        console.error('[useTradeUpdates] Invalid trade data received:', data);
        throw new Error('Invalid trade data received from API');
      }

      if (!tradeData.id) {
        console.error('[useTradeUpdates] Trade data missing ID:', tradeData);
        throw new Error('Trade data missing required ID field');
      }

      console.log(
        `[useTradeUpdates] Successfully fetched trade ${tradeData.id} with state: ${tradeData.leg1_state}`
      );

      // Store the trade data for future conditional requests
      previousDataRef.current = tradeData;
      return tradeData;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Fetch error');
    }
  }, [tradeId, apiUrl]);

  // Handle trade state changes
  const handleTradeStateChange = (newTrade: Trade) => {
    console.log(
      `[useTradeUpdates] Trade state changed to: ${newTrade.leg1_state} for trade ${tradeId}`
    );

    // Dispatch a custom event to notify other components
    const event = new CustomEvent('yapbay:trade-state-changed', {
      detail: { tradeId, newState: newTrade.leg1_state },
    });
    window.dispatchEvent(event);
    console.log(`[useTradeUpdates] Dispatched trade-state-changed event for trade ${tradeId}`);

    // Also dispatch the existing refresh event for backward compatibility
    const refreshEvent = new CustomEvent('yapbay:refresh-trade', {
      detail: { tradeId },
    });
    window.dispatchEvent(refreshEvent);
    console.log(`[useTradeUpdates] Dispatched refresh-trade event for trade ${tradeId}`);
  };

  // Use smart polling
  const polling = useSmartPolling(fetchTrade, [tradeId, apiUrl], {
    initialInterval: 5000,
    minInterval: 2000,
    maxInterval: 10000, // Reduced from 30000 to 10000 (10 seconds max)
    inactivityThreshold: 3 * 60 * 1000, // 3 minutes
    tradeStateChangeCallback: handleTradeStateChange,
  });

  return {
    trade: polling.data,
    error: polling.error,
    isPolling: polling.isPolling,
    currentInterval: polling.currentInterval,
    pausePolling: polling.pausePolling,
    resumePolling: polling.resumePolling,
    forcePoll: polling.forcePoll,
    isConnected: !!polling.data && !polling.error,
  };
}

export function isDeadlineExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  const deadlineTime = new Date(deadline).getTime();
  const currentTime = new Date().getTime();
  return currentTime > deadlineTime;
}
