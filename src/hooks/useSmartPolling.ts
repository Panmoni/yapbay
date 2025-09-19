import { useState, useEffect, useRef } from 'react';
import { Trade } from '@/api';

interface SmartPollingOptions {
  initialInterval?: number;
  minInterval?: number;
  maxInterval?: number;
  inactivityThreshold?: number;
  tradeStateChangeCallback?: (newTrade: Trade) => void;
}

export function useSmartPolling<T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = [],
  options: SmartPollingOptions = {}
) {
  const {
    initialInterval = 3000,
    minInterval = 1000,
    maxInterval = 30000,
    inactivityThreshold = 5 * 60 * 1000, // 5 minutes
    tradeStateChangeCallback,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(true);
  const [currentInterval, setCurrentInterval] = useState(initialInterval);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const previousDataRef = useRef<T | null>(null);
  const mountedRef = useRef<boolean>(true);

  // Function to check if the trade state has changed
  const hasTradeStateChanged = (prevTrade: Trade | null, newTrade: Trade | null): boolean => {
    if (!prevTrade || !newTrade) {
      console.log('[useSmartPolling] hasTradeStateChanged: missing trade data', {
        prevTrade: !!prevTrade,
        newTrade: !!newTrade,
      });
      return false;
    }

    if (!prevTrade.leg1_state || !newTrade.leg1_state) {
      console.log('[useSmartPolling] hasTradeStateChanged: missing leg1_state', {
        prevState: prevTrade.leg1_state,
        newState: newTrade.leg1_state,
      });
      return false;
    }

    const stateChanged = prevTrade.leg1_state !== newTrade.leg1_state;
    if (stateChanged) {
      console.log('[useSmartPolling] Trade state changed:', {
        from: prevTrade.leg1_state,
        to: newTrade.leg1_state,
      });
    }

    return stateChanged;
  };

  // Update last activity timestamp
  const updateActivity = () => {
    lastActivityRef.current = Date.now();

    // If we were in slow polling mode, switch back to faster polling
    if (currentInterval > initialInterval) {
      setCurrentInterval(initialInterval);
    }
  };

  // Polling function
  const poll = async () => {
    if (!mountedRef.current || !isPolling) return;

    try {
      const result = await fetchFn();

      if (mountedRef.current) {
        // Check if this is a trade and if its state has changed
        if (
          tradeStateChangeCallback &&
          hasTradeStateChanged(previousDataRef.current as Trade, result as Trade)
        ) {
          console.log('[useSmartPolling] Trade state change detected, calling callback');
          tradeStateChangeCallback(result as Trade);
          // Reset to fast polling when trade state changes
          setCurrentInterval(minInterval);
        } else {
          // Gradually increase polling interval if data hasn't changed
          const isDataSame = JSON.stringify(result) === JSON.stringify(previousDataRef.current);

          if (isDataSame) {
            // Check user inactivity
            const inactiveTime = Date.now() - lastActivityRef.current;

            if (inactiveTime > inactivityThreshold) {
              // User inactive - use max interval
              setCurrentInterval(maxInterval);
            } else {
              // Gradually slow down polling (but not beyond max)
              const newInterval = Math.min(currentInterval * 1.2, maxInterval);
              setCurrentInterval(newInterval);
            }
          } else {
            // Data changed but not the trade state - reset to initial interval
            setCurrentInterval(initialInterval);
          }
        }

        // Log only when trade state changes
        if (
          tradeStateChangeCallback &&
          hasTradeStateChanged(previousDataRef.current as Trade, result as Trade)
        ) {
          console.log(
            `[useSmartPolling] Trade state change detected: ${previousDataRef.current?.leg1_state} → ${result?.leg1_state}`
          );
        }

        setData(result);
        previousDataRef.current = result;
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Polling error'));
        // Back off on errors
        setCurrentInterval(Math.min(currentInterval * 2, maxInterval));
      }
    }

    // Schedule next poll
    if (mountedRef.current && isPolling) {
      timeoutRef.current = setTimeout(poll, currentInterval);
    }
  };

  // Set up polling and cleanup
  useEffect(() => {
    mountedRef.current = true;

    // Register user activity listeners
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Start polling
    poll();

    // Cleanup function
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Remove activity listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  // Allow manual control of polling
  const pausePolling = () => setIsPolling(false);
  const resumePolling = () => {
    setIsPolling(true);
    if (!timeoutRef.current) {
      poll();
    }
  };
  const forcePoll = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    poll();
  };

  return {
    data,
    error,
    isPolling,
    currentInterval,
    pausePolling,
    resumePolling,
    forcePoll,
    updateActivity,
  };
}
