import { create } from 'zustand';
import { ApiError } from '../api/client';

type CacheEntry<T = unknown> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  updatedAt: number;
};

type ApiCacheState = {
  entries: Record<string, CacheEntry>;
  inflight: Record<string, Promise<unknown> | undefined>;
  defaultTtlMs: number;
  getEntry: <T>(key: string) => CacheEntry<T> | undefined;
  fetchQuery: <T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { force?: boolean; ttlMs?: number },
  ) => Promise<T>;
  invalidate: (key: string) => void;
  invalidateMany: (predicate: (key: string) => boolean) => void;
  clear: () => void;
};

function errorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Error al cargar datos';
}

export const useApiCacheStore = create<ApiCacheState>((set, get) => ({
  entries: {},
  inflight: {},
  defaultTtlMs: 60_000,

  getEntry: <T,>(key: string) => get().entries[key] as CacheEntry<T> | undefined,

  fetchQuery: async <T,>(key: string, fetcher: () => Promise<T>, options = {}) => {
    const { entries, inflight, defaultTtlMs } = get();
    const entry = entries[key] as CacheEntry<T> | undefined;
    const ttlMs = options.ttlMs ?? defaultTtlMs;
    const isFresh = entry?.data !== null && entry?.data !== undefined && Date.now() - entry.updatedAt < ttlMs;

    if (!options.force && isFresh) return entry.data as T;
    if (!options.force && inflight[key]) return inflight[key] as Promise<T>;

    const promise = fetcher()
      .then((data) => {
        set((state) => ({
          entries: {
            ...state.entries,
            [key]: {
              data,
              loading: false,
              error: null,
              updatedAt: Date.now(),
            },
          },
          inflight: {
            ...state.inflight,
            [key]: undefined,
          },
        }));
        return data;
      })
      .catch((err: unknown) => {
        const message = errorMessage(err);
        set((state) => ({
          entries: {
            ...state.entries,
            [key]: {
              data: (state.entries[key]?.data ?? null),
              loading: false,
              error: message,
              updatedAt: state.entries[key]?.updatedAt ?? 0,
            },
          },
          inflight: {
            ...state.inflight,
            [key]: undefined,
          },
        }));
        throw err;
      });

    set((state) => ({
      entries: {
        ...state.entries,
        [key]: {
          data: (state.entries[key]?.data ?? null),
          loading: true,
          error: null,
          updatedAt: state.entries[key]?.updatedAt ?? 0,
        },
      },
      inflight: {
        ...state.inflight,
        [key]: promise,
      },
    }));

    return promise;
  },

  invalidate: (key: string) => {
    set((state) => {
      const next = { ...state.entries };
      delete next[key];
      return { entries: next };
    });
  },

  invalidateMany: (predicate: (key: string) => boolean) => {
    set((state) => {
      const next = Object.fromEntries(
        Object.entries(state.entries).filter(([key]) => !predicate(key)),
      );
      return { entries: next };
    });
  },

  clear: () => set({ entries: {}, inflight: {} }),
}));
