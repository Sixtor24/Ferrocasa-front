import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApiCacheStore } from '../stores/apiCacheStore';

type QueryState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

type QueryOptions = {
  key?: string;
  ttlMs?: number;
};

function serializeKeyPart(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function buildQueryKey(fetcher: () => Promise<unknown>, deps: unknown[]) {
  return `${fetcher.toString()}::${deps.map(serializeKeyPart).join('|')}`;
}

export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  enabled = true,
  options: QueryOptions = {},
): QueryState<T> {
  const queryKey = useMemo(
    () => options.key ?? buildQueryKey(fetcher, deps),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options.key, ...deps],
  );
  const entry = useApiCacheStore((state) => state.entries[queryKey]);
  const fetchQuery = useApiCacheStore((state) => state.fetchQuery);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;

    fetchQuery(queryKey, fetcher, {
      force: tick > 0,
      ttlMs: options.ttlMs,
    }).catch(() => {
      // El error queda en el store global para que todos los consumidores compartan el estado.
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, tick, enabled, options.ttlMs, fetchQuery, ...deps]);

  return {
    data: (entry?.data as T | null) ?? null,
    loading: enabled ? (entry?.loading ?? true) : false,
    error: entry?.error ?? null,
    refetch,
  };
}
