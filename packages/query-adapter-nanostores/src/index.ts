import {
  createAlpineBridgedAdapter,
  type QueryPluginOptions,
  query,
} from "@ailuracode/alpine-query";
import { NanoStores } from "@nanostores/alpine";
import type AlpineType from "alpinejs";
import { nanostoresQueryAdapter } from "./adapter.js";

export { nanostoresQueryAdapter } from "./adapter.js";

export type NanostoresQueryPluginOptions = QueryPluginOptions & {
  /** Register `@nanostores/alpine` (`x-nano`, `$nano`). Default: `true`. */
  registerNanoStores?: boolean;
};

export function createAlpineNanostoresAdapter(Alpine: AlpineType.Alpine) {
  return createAlpineBridgedAdapter(Alpine, nanostoresQueryAdapter);
}

/**
 * Convenience plugin: registers `@nanostores/alpine` (optional) and `$store.query`.
 * Prefer `query({ adapter: createAlpineNanostoresAdapter })` from `@ailuracode/alpine-query`.
 */
export default function nanostoresQueryPlugin(
  options: NanostoresQueryPluginOptions = {}
): AlpineType.PluginCallback {
  const { registerNanoStores = true, ...queryOptions } = options;
  const registerQuery = query({ adapter: createAlpineNanostoresAdapter, ...queryOptions });

  return function nanostoresQuery(Alpine) {
    if (registerNanoStores) {
      NanoStores(Alpine);
    }

    registerQuery(Alpine);
  };
}

export { directivePlugin, magicPlugin, modelDirectivePlugin, NanoStores } from "@nanostores/alpine";
