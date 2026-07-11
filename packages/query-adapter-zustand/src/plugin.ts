import type { QueryPluginOptions } from "@ailuracode/alpine-query";
import query, { createAlpineBridgedAdapter } from "@ailuracode/alpine-query-adapter-alpine";
import type AlpineType from "alpinejs";
import { zustandQueryAdapter } from "./adapter.js";

export { zustandQueryAdapter } from "./adapter.js";

export function createAlpineZustandAdapter(Alpine: AlpineType.Alpine) {
  return createAlpineBridgedAdapter(Alpine, zustandQueryAdapter);
}

/**
 * Convenience plugin using Zustand vanilla stores.
 * Prefer `query({ adapter: createAlpineZustandAdapter })` from `@ailuracode/alpine-query`.
 */
export default function zustandQueryPlugin(
  options: QueryPluginOptions = {}
): AlpineType.PluginCallback {
  return query({ adapter: createAlpineZustandAdapter, ...options });
}
