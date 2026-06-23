import { NanoStores } from "@nanostores/alpine";
import type AlpineType from "alpinejs";
import { createAlpineNanostoresAdapter } from "./adapters/alpine-nanostores.js";
import { QueryCache } from "./cache.js";
import { createQueryStore } from "./client.js";
import type { QueryPluginOptions } from "./types.js";
import { resolveQueryOptions, resolveRetryCount, resolveRetryDelay } from "./utils.js";

export { directivePlugin, magicPlugin, modelDirectivePlugin, NanoStores } from "@nanostores/alpine";
export { createAlpineNanostoresAdapter } from "./adapters/alpine-nanostores.js";
export { nanostoresQueryAdapter } from "./adapters/nanostores.js";
export type {
  MutationStateHandle,
  QueryStateAdapter,
  QueryStateHandle,
} from "./adapters/types.js";
export { vanillaQueryAdapter } from "./adapters/vanilla.js";
export { createQueryClient } from "./client.js";
export type {
  MutationDevtoolsEntry,
  QueryDevtoolsApi,
  QueryDevtoolsEntry,
  QueryDevtoolsSnapshot,
} from "./devtools.js";
export type {
  FetchStatus,
  MutationOptions,
  MutationState,
  MutationStatus,
  QueryClientOptions,
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
  const registerNanoStores = options.registerNanoStores ?? true;

  return function registerQuery(Alpine) {
    if (registerNanoStores) {
      NanoStores(Alpine);
    }

    const cache = new QueryCache({
      defaultQueryOptions: resolveQueryOptions(defaultQueryOptions, {}),
      defaultMutationRetry: resolveRetryCount(defaultMutationOptions.retry, 0),
      defaultMutationRetryDelay: resolveRetryDelay(defaultMutationOptions.retryDelay, 1000),
      adapter: createAlpineNanostoresAdapter(Alpine),
    });

    Alpine.store("query", createQueryStore(cache));
  };
}

export { hashKey, matchesQueryKey } from "./utils.js";
