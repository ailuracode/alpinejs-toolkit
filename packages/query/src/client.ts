import type { QueryStateAdapter } from "./adapters/types.js";
import { vanillaQueryAdapter } from "./adapters/vanilla.js";
import { QueryCache } from "./cache.js";
import type { QueryClientOptions, QueryStore } from "./types.js";
import { resolveQueryOptions, resolveRetryCount, resolveRetryDelay } from "./utils.js";

function resolveCacheConfig(options: QueryClientOptions) {
  const defaultQueryOptions = options.defaultOptions?.queries ?? {};
  const defaultMutationOptions = options.defaultOptions?.mutations ?? {};

  return {
    defaultQueryOptions: resolveQueryOptions(defaultQueryOptions, {}),
    defaultMutationRetry: resolveRetryCount(defaultMutationOptions.retry, 0),
    defaultMutationRetryDelay: resolveRetryDelay(defaultMutationOptions.retryDelay, 1000),
  };
}

/** Store-agnostic query client. Pass a `QueryStateAdapter` or use the vanilla default. */
export function createQueryClient(options: QueryClientOptions = {}): QueryStore {
  const adapter = options.adapter ?? vanillaQueryAdapter;

  const cache = new QueryCache({
    ...resolveCacheConfig(options),
    adapter,
  });

  return createQueryStore(cache);
}

export function createQueryStore(cache: QueryCache): QueryStore {
  return {
    devtools: cache.getDevtools(),
    observe(key, queryFn, queryOptions) {
      return cache.observe(key, queryFn, queryOptions);
    },
    fetch(key, queryFn, queryOptions) {
      return cache.fetch(key, queryFn, queryOptions);
    },
    get(key) {
      return cache.get(key);
    },
    prefetch(key, queryFn, queryOptions) {
      return cache.prefetch(key, queryFn, queryOptions);
    },
    invalidate(key) {
      cache.invalidate(key);
    },
    remove(key) {
      cache.remove(key);
    },
    setData(key, data) {
      cache.setData(key, data);
    },
    cancel(key) {
      cache.cancel(key);
    },
    reset() {
      cache.reset();
    },
    mutate(mutationOptions) {
      return cache.mutate(mutationOptions);
    },
  };
}

export type { QueryStateAdapter };
