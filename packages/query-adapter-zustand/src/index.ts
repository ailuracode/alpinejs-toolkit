import {
  createAlpineBridgedAdapter,
  createQueryPlugin,
  type QueryPluginOptions,
} from "@ailuracode/alpine-query";
import type AlpineType from "alpinejs";
import { zustandQueryAdapter } from "./adapter.js";

export { zustandQueryAdapter } from "./adapter.js";

export function createAlpineZustandAdapter(Alpine: AlpineType.Alpine) {
  return createAlpineBridgedAdapter(Alpine, zustandQueryAdapter);
}

/**
 * Alpine.js query plugin using Zustand vanilla stores.
 * Bridges Zustand subscriptions into Alpine.reactive (no official zustand-alpine package).
 */
export default function zustandQueryPlugin(
  options: QueryPluginOptions = {}
): AlpineType.PluginCallback {
  return createQueryPlugin(createAlpineZustandAdapter, options);
}
