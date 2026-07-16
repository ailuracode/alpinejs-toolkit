/**
 * Alpine.js integration for `@ailuracode/alpine-realtime`.
 *
 * Wires a {@link RealtimeController} into `$store.realtime` and
 * the `$realtime` magic. Mirrors the toolkit's standard plugin
 * shape:
 *
 * 1. `realtimePlugin(defaultConfig?)` is a factory that returns
 *    the `Alpine.plugin(...)` callback.
 * 2. The returned callback synchronously constructs the
 *    controller, registers `$store.realtime`, registers the
 *    `$realtime` magic, and starts an async adapter-resolution
 *    loop. Once the adapter is resolved, the plugin binds it to
 *    the controller via `setAdapter()`.
 * 3. Multiple controllers are supported by registering extra
 *    `Alpine.store("realtime:<id>", ...)` entries; the magic and
 *    store mirror the default instance.
 *
 * The plugin factory has zero constructor side effects — the
 * controller is built when Alpine calls the registered callback,
 * not when `realtimePlugin()` is invoked.
 *
 * @module
 */

import type { RealtimeTransportAdapter } from "../adapters/RealtimeTransportAdapter";
import type { SseTransportAdapterOptions } from "../adapters/SseTransportAdapter";
import {
  createAutoTransport,
  createSseTransport,
  createWsTransport,
} from "../adapters/TransportAdapterFactory";
import type { WsTransportAdapterOptions } from "../adapters/WsTransportAdapter";
import type { RealtimeControllerConfig } from "../controller/RealtimeControllerConfig";
import { RealtimeError } from "../controller/RealtimeError";
import { createRealtimePluginWithResolver } from "./register.js";
import type { RealtimePluginCallback } from "./surface.js";

/**
 * Default `Alpine.store` key the plugin registers. Consumers
 * may override by passing `id: "..."` in the config — the
 * controller's `id` and the store key always stay in sync.
 */
export {
  createRealtimeMagic,
  createRealtimeStore,
  REALTIME_MAGIC_KEY,
  REALTIME_STORE_KEY,
  type RealtimeAlpine,
  type RealtimeMagic,
  type RealtimePluginCallback,
  type RealtimeStore,
} from "./surface";

/**
 * Plugin factory. Returns the Alpine plugin callback that wires
 * the realtime controller, store, and magic.
 *
 * @param defaultConfig - Optional controller config. The `id`
 *   field doubles as the Alpine store key (default `"realtime"`).
 *
 * @example
 * ```ts
 * import Alpine from "alpinejs";
 * import realtimePlugin from "@ailuracode/alpine-realtime";
 *
 * Alpine.plugin(realtimePlugin({ transport: "websocket", endpoint: "/ws" }));
 * Alpine.start();
 * ```
 */
export function realtimePlugin(
  defaultConfig: RealtimeControllerConfig = {}
): RealtimePluginCallback {
  return createRealtimePluginWithResolver(resolveAdapter, defaultConfig);
}

/**
 * Default export for `Alpine.plugin(realtimePlugin())` style
 * imports.
 */
export default realtimePlugin;

/**
 * Resolve the appropriate {@link RealtimeTransportAdapter} from
 * the controller config. Pure factory — no network activity.
 *
 * Resolution order:
 *
 * 1. `config.adapter` if already provided (highest priority).
 * 2. `config.transport` when set to `"sse"` / `"websocket"`.
 * 3. `createAutoTransport()` for `"auto"` (the controller's
 *    default) and the explicit `"broadcastchannel"` selection
 *    that v0.2.0 will fulfil.
 * 4. `Promise.reject(...)` when the runtime lacks both
 *    `EventSource` and `WebSocket` — the plugin surfaces the
 *    rejection through a controller `error` event.
 */
export function resolveAdapter(
  config: RealtimeControllerConfig
): Promise<RealtimeTransportAdapter> {
  if (config.adapter) {
    return Promise.resolve(config.adapter);
  }

  switch (config.transport) {
    case "sse":
      return Promise.resolve(
        createSseTransport({
          url: config.endpoint ?? "",
          withCredentials: false,
        })
      );
    case "websocket":
      return Promise.resolve(
        createWsTransport({
          url: config.endpoint ?? "",
        })
      );
    case "broadcastchannel":
      // v0.2.0 — fail loudly so the contract seam stays in place.
      return Promise.reject(broadcastNotImplemented());
    default:
      return createAutoTransport({ url: config.endpoint ?? "" });
  }
}

/**
 * Build a typed error for the v0.2.0 BroadcastChannel seam.
 * Kept local so the plugin doesn't carry a runtime dependency
 * on `createAdapterError` purely for this one branch.
 */
function broadcastNotImplemented(): RealtimeError {
  return new RealtimeError(
    "BroadcastChannel transport is not implemented in v0.1.0; use 'sse' or 'websocket'",
    "ADAPTER_ERROR",
    { retryable: false }
  );
}

// Type-only re-exports for downstream consumers who prefer
// importing the SSE / WS option shapes alongside the plugin.
export type { SseTransportAdapterOptions, WsTransportAdapterOptions };
