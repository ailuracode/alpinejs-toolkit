import { type QueryPluginOptions, query } from "@ailuracode/alpinejs-query";
import type AlpineType from "alpinejs";
import { createAlpineStoreAdapter } from "./adapter.js";

export { alpineStoreQueryAdapter, createAlpineStoreAdapter } from "./adapter.js";

/**
 * Convenience plugin for native `Alpine.reactive`.
 * Prefer `query({ adapter: createAlpineStoreAdapter })` from `@ailuracode/alpinejs-query`.
 */
export default function alpineStoreQueryPlugin(
  options: QueryPluginOptions = {}
): AlpineType.PluginCallback {
  return query({ adapter: createAlpineStoreAdapter, ...options });
}
