import type AlpineType from "alpinejs";
import type { QueryStateAdapter } from "./adapters/types.js";
import { QueryCache } from "./cache.js";
import { createQueryStore } from "./client.js";
import type { QueryPluginOptions } from "./types.js";
import { resolveQueryOptions, resolveRetryCount, resolveRetryDelay } from "./utils.js";

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
 * import query from "@ailuracode/alpine-query";
 * import { createAlpineNanostoresAdapter } from "@ailuracode/alpine-query-adapter-nanostores";
 *
 * Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
 */
export default function query({
  adapter,
  ...options
}: QueryRegisterOptions): AlpineType.PluginCallback {
  return createQueryPlugin(adapter, options);
}
