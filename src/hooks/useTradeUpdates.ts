import { useState, useEffect, useRef, useCallback } from 'react';
import { Trade } from '@/api';

export function useTradeUpdates(tradeId: number, apiUrl?: string, pollInterval = 5000) {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Wrap fetchTrade with useCallback to memoize it
  const fetchTrade = useCallback(async () => {
    if (!tradeId) return;

    const baseUrl = apiUrl || import.meta.env.VITE_API_URL || "http://localhost:3000";
    const token = localStorage.getItem('token');

    if (!token) {
      setError(new Error('No authentication token found'));
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/trades/${tradeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch trade: ${response.statusText}`);
      }

      const data = await response.json();
      setTrade(data);
      setError(null);
      setIsConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fetch error'));
      setIsConnected(false);
    }
  }, [tradeId, apiUrl]); // Add dependencies that fetchTrade relies on

  useEffect(() => {
    if (!tradeId) return;

    // Initial fetch
    fetchTrade();

    // Start polling
    pollingRef.current = setInterval(fetchTrade, pollInterval);

    // Cleanup
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [tradeId, apiUrl, pollInterval, fetchTrade]); // Add fetchTrade as a dependency

  return { trade, error, isConnected };
}

export function isDeadlineExpired(deadline: string | null): boolean {
  if (!deadline) return false;
  const deadlineTime = new Date(deadline).getTime();
  const currentTime = new Date().getTime();
  return currentTime > deadlineTime;
}
