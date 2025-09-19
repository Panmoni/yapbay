import { useCallback, useRef } from 'react';
import { Trade, getTradeById } from '@/api';
import { useSmartPolling } from './useSmartPolling';

export function useTradeUpdates(tradeId: number) {
  // Keep track of the previous data and ETag
  const previousDataRef = useRef<Trade | null>(null);
  const etagRef = useRef<string | null>(null);

  // Memoize fetch function to avoid recreating it on each render
  const fetchTrade = useCallback(async (): Promise<Trade | null> => {
    if (tradeId === null || tradeId === undefined) {
      console.log(`[useTradeUpdates] Skipping fetch - tradeId is ${tradeId}`);
      return null;
    }

    console.log(`[useTradeUpdates] Starting fetch for tradeId: ${tradeId}`);

    try {
      // Use the same API function that useTradeDetails uses
      const response = await getTradeById(tradeId);

      console.log(`[useTradeUpdates] API response for trade ${tradeId}:`, {
        status: response.status,
        statusText: response.statusText,
      });

      // Extract trade object from response - handle both old and new API response formats
      const tradeData = (response.data as any).trade || response.data;

      // Validate that we have a proper trade object
      if (!tradeData || typeof tradeData !== 'object') {
        console.error('[useTradeUpdates] Invalid trade data received:', response.data);
        throw new Error('Invalid trade data received from API');
      }

      if (!tradeData.id) {
        console.error('[useTradeUpdates] Trade data missing ID:', tradeData);
        throw new Error('Trade data missing required ID field');
      }

      console.log(
        `[useTradeUpdates] Successfully fetched trade ${tradeData.id} with state: ${tradeData.leg1_state} at ${tradeData.updated_at}`
      );

      // Compare with previous data to detect changes
      const previousData = previousDataRef.current;
      const hasStateChanged = previousData && previousData.leg1_state !== tradeData.leg1_state;

      if (hasStateChanged) {
        console.log(
          `[useTradeUpdates] Trade ${tradeData.id} state changed: ${previousData.leg1_state} → ${tradeData.leg1_state}`
        );
      }

      // Store the trade data for future conditional requests
      previousDataRef.current = tradeData;
      return tradeData;
    } catch (err) {
      console.error(`[useTradeUpdates] Error fetching trade ${tradeId}:`, err);
      throw err instanceof Error ? err : new Error('Fetch error');
    }
  }, [tradeId]);

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
  const polling = useSmartPolling(fetchTrade, [tradeId], {
    initialInterval: 5000,
    minInterval: 2000,
    maxInterval: 10000, // Reduced from 30000 to 10000 (10 seconds max)
    inactivityThreshold: 3 * 60 * 1000, // 3 minutes
    tradeStateChangeCallback: handleTradeStateChange,
  });

  // Function to force a fresh fetch by clearing cache
  const forceRefresh = useCallback(() => {
    console.log(`[useTradeUpdates] Force refreshing trade ${tradeId} - clearing cache`);
    previousDataRef.current = null;
    etagRef.current = null;
    polling.forcePoll();
  }, [tradeId, polling]);

  // Log polling status only when there are errors
  if (polling.error) {
    console.error(`[useTradeUpdates] Polling error for trade ${tradeId}:`, polling.error.message);
  }

  return {
    trade: polling.data,
    error: polling.error,
    isPolling: polling.isPolling,
    currentInterval: polling.currentInterval,
    pausePolling: polling.pausePolling,
    resumePolling: polling.resumePolling,
    forcePoll: polling.forcePoll,
    forceRefresh,
    isConnected: !!polling.data && !polling.error,
  };
}

export function isDeadlineExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  const deadlineTime = new Date(deadline).getTime();
  const currentTime = new Date().getTime();
  return currentTime > deadlineTime;
}
