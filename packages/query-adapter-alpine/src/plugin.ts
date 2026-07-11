import type { QueryPluginOptions, QueryStateAdapter } from "@ailuracode/alpine-query";
import {
  createQueryStore,
  QueryCache,
  resolveQueryOptions,
  resolveRetryCount,
  resolveRetryDelay,
} from "@ailuracode/alpine-query";
import type AlpineType from "alpinejs";
import { createAlpineStoreAdapter } from "./adapter.js";

export { alpineStoreQueryAdapter, createAlpineStoreAdapter } from "./adapter.js";
export {
  bridgeMutationHandleToAlpine,
  bridgeQueryHandleToAlpine,
  createAlpineBridgedAdapter,
} from "./bridge.js";

export type QueryAdapterFactory = (Alpine: AlpineType.Alpine) => QueryStateAdapter;

export type QueryRegisterOptions = QueryPluginOptions & {
  adapter: QueryStateAdapter | QueryAdapterFactory;
};

function resolveAdapter(
  adapter: QueryStateAdapter | QueryAdapterFactory,
  Alpine: AlpineType.Alpine
): QueryStateAdapter {
  return typeof adapter === "function" ? adapter(Alpine) : adapter;
}

/** Registers `$store.query` using the given state adapter. */
export function createQueryPlugin(
  adapter: QueryStateAdapter | QueryAdapterFactory,
  options: QueryPluginOptions = {}
): AlpineType.PluginCallback {
  const defaultQueryOptions = options.defaultOptions?.queries ?? {};
  const defaultMutationOptions = options.defaultOptions?.mutations ?? {};

  return function registerQuery(Alpine) {
    const cache = new QueryCache({
      defaultQueryOptions: resolveQueryOptions(defaultQueryOptions, {}),
      defaultMutationRetry: resolveRetryCount(defaultMutationOptions.retry, 0),
      defaultMutationRetryDelay: resolveRetryDelay(defaultMutationOptions.retryDelay, 1000),
      adapter: resolveAdapter(adapter, Alpine),
    });

    Alpine.store("query", createQueryStore(cache));
  };
}

/**
 * Alpine.js query plugin. Pass a state adapter, then registers `$store.query`.
 *
 * @example
 * import query from "@ailuracode/alpine-query-adapter-alpine";
 * import { createAlpineNanostoresAdapter } from "@ailuracode/alpine-query-kit";
 *
 * Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
 */
export default function query({
  adapter,
  ...options
}: QueryRegisterOptions): AlpineType.PluginCallback {
  return createQueryPlugin(adapter, options);
}

/**
 * Convenience plugin for native `Alpine.reactive`.
 * Prefer `query({ adapter: createAlpineStoreAdapter })` from `@ailuracode/alpine-query-adapter-alpine`.
 */
export function alpineStoreQueryPlugin(
  options: QueryPluginOptions = {}
): AlpineType.PluginCallback {
  return query({ adapter: createAlpineStoreAdapter, ...options });
}
