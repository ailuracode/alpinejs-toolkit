import { createQueryPlugin, type QueryPluginOptions } from "@ailuracode/alpine-query";
import type AlpineType from "alpinejs";
import { createAlpineStoreAdapter } from "./adapter.js";

export { alpineStoreQueryAdapter, createAlpineStoreAdapter } from "./adapter.js";

/** Alpine.js query plugin using native `Alpine.reactive` state. */
export default function alpineStoreQueryPlugin(
  options: QueryPluginOptions = {}
): AlpineType.PluginCallback {
  return createQueryPlugin(createAlpineStoreAdapter, options);
}
