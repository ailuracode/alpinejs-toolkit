import type { QueryStateHandle } from "./adapters/types.js";
import type { QueryFunction, QueryKey, QueryState, ResolvedQueryOptions } from "./types.js";

export type QueryEntry<TData = unknown> = {
  key: QueryKey;
  keyHash: string;
  queryFn: QueryFunction<TData>;
  options: ResolvedQueryOptions<TData>;
  handle: QueryStateHandle<TData>;
  state: QueryState<TData>;
  observers: number;
  gcTimeout: ReturnType<typeof setTimeout> | null;
  intervalId: ReturnType<typeof setInterval> | null;
  fetchPromise: Promise<void> | null;
  abortController: AbortController | null;
  fetchGeneration: number;
  isInvalidated: boolean;
  fetchStartedAt: number | null;
  lastFetchDurationMs: number | null;
  devtoolsUnsubscribe?: () => void;
  /** Set when adapter/devtools resources are released; prevents duplicate disposal. */
  disposed: boolean;
};

export type QueryCacheInternals = {
  getEntries(): QueryEntry[];
  getEntryByHash(keyHash: string): QueryEntry | undefined;
  refetchEntry(keyHash: string): Promise<void> | undefined;
  invalidateEntry(keyHash: string): void;
  /**
   * Forcibly removes a cache entry by hash. Cancels timers and in-flight fetches,
   * disposes adapter handles, and unsubscribes devtools listeners. Active
   * observers are detached without decrementing their local subscription; a
   * subsequent `destroy()` on the observe result is a no-op.
   */
  removeEntry(keyHash: string): void;
};
