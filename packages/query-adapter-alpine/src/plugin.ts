import { guardStore } from "@ailuracode/alpine-core/registration";
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
  /**
   * `$store.query` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_QUERY_STORE_KEY}. Set when the host
   * already owns a `query` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the query cache.
   */
  readonly storeKey?: string;
};

/** Options accepted by {@link createQueryPlugin} (no `adapter` required). */
export interface CreateQueryPluginOptions extends Omit<QueryPluginOptions, "adapter"> {
  /**
   * `$store.query` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_QUERY_STORE_KEY}. Set when the host
   * already owns a `query` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the query cache.
   */
  readonly storeKey?: string;
}

/** Default `$store.query` key registered by {@link createQueryPlugin}. */
export const DEFAULT_QUERY_STORE_KEY = "query";

function resolveAdapter(
  adapter: QueryStateAdapter | QueryAdapterFactory,
  Alpine: AlpineType.Alpine
): QueryStateAdapter {
  return typeof adapter === "function" ? adapter(Alpine) : adapter;
}

/** Registers `$store.query` using the given state adapter. */
export function createQueryPlugin(
  adapter: QueryStateAdapter | QueryAdapterFactory,
  options: CreateQueryPluginOptions = {}
): AlpineType.PluginCallback {
  const defaultQueryOptions = options.defaultOptions?.queries ?? {};
  const defaultMutationOptions = options.defaultOptions?.mutations ?? {};
  const storeKey = options.storeKey ?? DEFAULT_QUERY_STORE_KEY;

  return function registerQuery(Alpine) {
    const cache = new QueryCache({
      defaultQueryOptions: resolveQueryOptions(defaultQueryOptions, {}),
      defaultMutationRetry: resolveRetryCount(defaultMutationOptions.retry, 0),
      defaultMutationRetryDelay: resolveRetryDelay(defaultMutationOptions.retryDelay, 1000),
      adapter: resolveAdapter(adapter, Alpine),
    });

    guardStore(Alpine, storeKey, createQueryStore(cache), "query-adapter-alpine", {
      override: true,
      silent: true,
    });

    const augmented = Alpine as AlpineType.Alpine & {
      cleanup?(callback: () => void): void;
    };

    if (typeof augmented.cleanup === "function") {
      augmented.cleanup(() => {
        cache.destroy();
      });
    }
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
