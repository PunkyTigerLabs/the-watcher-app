// ============================================
// THE WATCHER — React Hooks for API
// ============================================
// useWatcher: fetch + loading + error + refresh

import { useState, useEffect, useCallback } from 'react';
import { WatcherError } from './watcher';

interface UseWatcherResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  refresh: () => void;
}

export function useWatcher<T>(
  fetcher: () => Promise<T>,
  deps: any[] = [],
): UseWatcherResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setErrorCode(null);

    fetcher()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          if (err instanceof WatcherError) {
            setError(err.message);
            setErrorCode(err.code);
          } else {
            setError('Something went wrong');
            setErrorCode('UNKNOWN');
          }
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [...deps, refreshKey]);

  return { data, loading, error, errorCode, refresh };
}

// Auto-refresh hook (polls every N seconds)
export function useAutoRefresh<T>(
  fetcher: () => Promise<T>,
  intervalMs: number = 60000,
  deps: any[] = [],
): UseWatcherResult<T> {
  const result = useWatcher(fetcher, deps);

  useEffect(() => {
    const timer = setInterval(() => {
      result.refresh();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return result;
}
