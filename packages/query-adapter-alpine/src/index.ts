import { type QueryPluginOptions, query } from "@ailuracode/alpine-query";
import type AlpineType from "alpinejs";
import { createAlpineStoreAdapter } from "./adapter.js";

export { alpineStoreQueryAdapter, createAlpineStoreAdapter } from "./adapter.js";

/**
 * Convenience plugin for native `Alpine.reactive`.
 * Prefer `query({ adapter: createAlpineStoreAdapter })` from `@ailuracode/alpine-query`.
 */
export default function alpineStoreQueryPlugin(
  options: QueryPluginOptions = {}
): AlpineType.PluginCallback {
  return query({ adapter: createAlpineStoreAdapter, ...options });
}
