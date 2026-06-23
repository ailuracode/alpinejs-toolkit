import type { QueryStateHandle } from "./adapters/types.js";
import type { QueryKey, QueryState, ResolvedQueryOptions } from "./types.js";

export type QueryEntry<TData = unknown> = {
  key: QueryKey;
  keyHash: string;
  queryFn: () => Promise<TData>;
  options: ResolvedQueryOptions<TData>;
  handle: QueryStateHandle<TData>;
  state: QueryState<TData>;
  observers: number;
  gcTimeout: ReturnType<typeof setTimeout> | null;
  intervalId: ReturnType<typeof setInterval> | null;
  fetchPromise: Promise<void> | null;
  abortController: AbortController | null;
  isInvalidated: boolean;
};

export type QueryCacheInternals = {
  getEntries(): QueryEntry[];
  getEntryByHash(keyHash: string): QueryEntry | undefined;
  refetchEntry(keyHash: string): Promise<void> | undefined;
  invalidateEntry(keyHash: string): void;
  removeEntry(keyHash: string): void;
};
