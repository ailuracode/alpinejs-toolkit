import type AlpineType from "alpinejs";
import { QueryCache } from "./cache.js";
import type {
  MutationOptions,
  MutationState,
  QueryKey,
  QueryOptions,
  QueryPluginOptions,
  QueryState,
  QueryStore,
} from "./types.js";
import { resolveQueryOptions, resolveRetryCount, resolveRetryDelay } from "./utils.js";

export type {
  FetchStatus,
  MutationOptions,
  MutationState,
  MutationStatus,
  QueryKey,
  QueryOptions,
  QueryPluginOptions,
  QueryState,
  QueryStore,
} from "./types.js";

/** Alpine.js query plugin inspired by TanStack Query. Registers `$store.query`. */
export default function queryPlugin(options: QueryPluginOptions = {}): AlpineType.PluginCallback {
  const defaultQueryOptions = options.defaultOptions?.queries ?? {};
  const defaultMutationOptions = options.defaultOptions?.mutations ?? {};

  return function registerQuery(Alpine) {
    const cache = new QueryCache(Alpine.reactive, {
      defaultQueryOptions: resolveQueryOptions(defaultQueryOptions, {}),
      defaultMutationRetry: resolveRetryCount(defaultMutationOptions.retry, 0),
      defaultMutationRetryDelay: resolveRetryDelay(defaultMutationOptions.retryDelay, 1000),
    });

    const queryStore: QueryStore = {
      observe<TData>(
        key: QueryKey,
        queryFn: () => Promise<TData>,
        queryOptions?: QueryOptions<TData>
      ) {
        return cache.observe(
          key,
          queryFn,
          resolveQueryOptions(queryOptions, defaultQueryOptions)
        ) as QueryState<TData> & { destroy(): void };
      },

      fetch<TData>(
        key: QueryKey,
        queryFn: () => Promise<TData>,
        queryOptions?: QueryOptions<TData>
      ) {
        return cache.fetch(
          key,
          queryFn,
          resolveQueryOptions(queryOptions, defaultQueryOptions)
        ) as QueryState<TData>;
      },

      get<TData>(key: QueryKey) {
        return cache.get(key) as QueryState<TData> | undefined;
      },

      prefetch<TData>(
        key: QueryKey,
        queryFn: () => Promise<TData>,
        queryOptions?: QueryOptions<TData>
      ) {
        return cache.prefetch(key, queryFn, resolveQueryOptions(queryOptions, defaultQueryOptions));
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

      mutate<TData, TVariables = void, TContext = unknown>(
        mutationOptions: MutationOptions<TData, TVariables, TContext>
      ): MutationState<TData, TVariables> {
        return cache.mutate(mutationOptions);
      },
    };

    Alpine.store("query", queryStore);
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      query: QueryStore;
    }
  }
}

export { hashKey, matchesQueryKey } from "./utils.js";
