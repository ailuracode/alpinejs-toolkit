import type { QueryStateAdapter } from "./adapters/types.js";
import { vanillaQueryAdapter } from "./adapters/vanilla.js";
import { QueryCache } from "./cache.js";
import { isQueryDefinition, splitQueryDefinition } from "./options.js";
import type {
  InferQueryData,
  QueryClientOptions,
  QueryDefinition,
  QueryFunction,
  QueryKey,
  QueryOptions,
  QueryState,
  QueryStore,
} from "./types.js";
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

function createObserve(cache: QueryCache): QueryStore["observe"] {
  function observe<TData>(
    key: QueryKey,
    queryFn: QueryFunction<TData>,
    options?: QueryOptions<TData>
  ): QueryState<TData> & { destroy(): void };
  function observe<TQueryFn extends QueryFunction<unknown>, TData = InferQueryData<TQueryFn>>(
    key: QueryKey,
    queryFn: TQueryFn,
    options?: QueryOptions<TData>
  ): QueryState<TData> & { destroy(): void };
  function observe<
    const TKey extends QueryKey,
    TQueryFn extends QueryFunction<unknown>,
    TData = InferQueryData<TQueryFn>,
  >(
    definition: {
      queryKey: TKey;
      queryFn: TQueryFn;
    } & QueryOptions<TData>
  ): QueryState<TData> & { destroy(): void };
  function observe(
    keyOrDefinition: QueryKey | QueryDefinition,
    queryFn?: QueryFunction<unknown>,
    queryOptions?: QueryOptions<unknown>
  ) {
    if (isQueryDefinition(keyOrDefinition)) {
      const { queryKey, queryFn: fn, options } = splitQueryDefinition(keyOrDefinition);
      return cache.observe(queryKey, fn, options);
    }

    if (!queryFn) {
      throw new Error("queryFn is required when observe() is called with a query key");
    }

    return cache.observe(keyOrDefinition, queryFn, queryOptions);
  }

  return observe;
}

function createFetch(cache: QueryCache): QueryStore["fetch"] {
  function fetch<TData>(
    key: QueryKey,
    queryFn: QueryFunction<TData>,
    options?: QueryOptions<TData>
  ): QueryState<TData>;
  function fetch<TQueryFn extends QueryFunction<unknown>, TData = InferQueryData<TQueryFn>>(
    key: QueryKey,
    queryFn: TQueryFn,
    options?: QueryOptions<TData>
  ): QueryState<TData>;
  function fetch<
    const TKey extends QueryKey,
    TQueryFn extends QueryFunction<unknown>,
    TData = InferQueryData<TQueryFn>,
  >(
    definition: {
      queryKey: TKey;
      queryFn: TQueryFn;
    } & QueryOptions<TData>
  ): QueryState<TData>;
  function fetch(
    keyOrDefinition: QueryKey | QueryDefinition,
    queryFn?: QueryFunction<unknown>,
    queryOptions?: QueryOptions<unknown>
  ) {
    if (isQueryDefinition(keyOrDefinition)) {
      const { queryKey, queryFn: fn, options } = splitQueryDefinition(keyOrDefinition);
      return cache.fetch(queryKey, fn, options);
    }

    if (!queryFn) {
      throw new Error("queryFn is required when fetch() is called with a query key");
    }

    return cache.fetch(keyOrDefinition, queryFn, queryOptions);
  }

  return fetch;
}

function createPrefetch(cache: QueryCache): QueryStore["prefetch"] {
  function prefetch<TData>(
    key: QueryKey,
    queryFn: QueryFunction<TData>,
    options?: QueryOptions<TData>
  ): Promise<void>;
  function prefetch<TQueryFn extends QueryFunction<unknown>, TData = InferQueryData<TQueryFn>>(
    key: QueryKey,
    queryFn: TQueryFn,
    options?: QueryOptions<TData>
  ): Promise<void>;
  function prefetch<
    const TKey extends QueryKey,
    TQueryFn extends QueryFunction<unknown>,
    TData = InferQueryData<TQueryFn>,
  >(
    definition: {
      queryKey: TKey;
      queryFn: TQueryFn;
    } & QueryOptions<TData>
  ): Promise<void>;
  function prefetch(
    keyOrDefinition: QueryKey | QueryDefinition,
    queryFn?: QueryFunction<unknown>,
    queryOptions?: QueryOptions<unknown>
  ) {
    if (isQueryDefinition(keyOrDefinition)) {
      const { queryKey, queryFn: fn, options } = splitQueryDefinition(keyOrDefinition);
      return cache.prefetch(queryKey, fn, options);
    }

    if (!queryFn) {
      throw new Error("queryFn is required when prefetch() is called with a query key");
    }

    return cache.prefetch(keyOrDefinition, queryFn, queryOptions);
  }

  return prefetch;
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
    observe: createObserve(cache),
    fetch: createFetch(cache),
    get(key) {
      return cache.get(key);
    },
    prefetch: createPrefetch(cache),
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
    resetQueries(key) {
      cache.resetQueries(key);
    },
    clearMutations() {
      cache.getDevtools().clearMutations();
    },
    destroy() {
      cache.destroy();
    },
    mutate(mutationOptions) {
      return cache.mutate(mutationOptions);
    },
  };
}

export type { QueryStateAdapter };
