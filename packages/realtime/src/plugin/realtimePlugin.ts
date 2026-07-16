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

import type { Alpine } from "alpinejs";
import type { RealtimeTransportAdapter } from "../adapters/RealtimeTransportAdapter";
import type { SseTransportAdapterOptions } from "../adapters/SseTransportAdapter";
import {
  createAutoTransport,
  createSseTransport,
  createWsTransport,
} from "../adapters/TransportAdapterFactory";
import type { WsTransportAdapterOptions } from "../adapters/WsTransportAdapter";
import { RealtimeController } from "../controller/RealtimeController";
import type { RealtimeControllerConfig } from "../controller/RealtimeControllerConfig";
import type { RealtimeControllerState } from "../controller/RealtimeControllerState";
import { RealtimeError } from "../controller/RealtimeError";
import { bridgeControllerStore, type Destroyable } from "../core-deps.js";

/**
 * Default `Alpine.store` key the plugin registers. Consumers
 * may override by passing `id: "..."` in the config — the
 * controller's `id` and the store key always stay in sync.
 */
export const REALTIME_STORE_KEY = "realtime";

/**
 * Default magic accessor the plugin registers. Override via
 * `storeKey: "..."` on the config (mirrored to `id`).
 */
export const REALTIME_MAGIC_KEY = "realtime";

/**
 * Type of the `$store.realtime` Alpine exposes.
 *
 * The shape is a `RealtimeControllerState` snapshot plus an
 * `isReady` getter that mirrors `state.status === "connected"`.
 * Methods are exposed through `$realtime` (see
 * {@link RealtimeMagic}); the store stays read-only from the
 * outside (consumers should never mutate `state` directly) but
 * the bridge writes to it during status updates so the field
 * is internally mutable on the reactive proxy.
 */
export interface RealtimeStore {
  state: RealtimeControllerState;
  readonly isReady: boolean;
}

/**
 * Type of the `$realtime` Alpine exposes.
 *
 * Mirrors the controller's command surface so consumers can
 * write `$realtime.subscribe("ch", handler)` /
 * `$realtime.publish("ch", message)` from a template or a JS
 * callback without going through `$store`.
 */
export interface RealtimeMagic {
  readonly controller: RealtimeController;
  readonly state: RealtimeControllerState;
  readonly isReady: boolean;
  connect(overrides?: RealtimeControllerConfig): Promise<void>;
  disconnect(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  destroy(): Promise<void>;
  subscribe(
    channel: string,
    handler: (message: import("../controller/RealtimeMessage").RealtimeMessage) => void
  ): () => void;
  unsubscribe(
    channel: string,
    handler?: (message: import("../controller/RealtimeMessage").RealtimeMessage) => void
  ): void;
  publish(
    channel: string,
    message: import("../controller/RealtimeMessage").RealtimeMessage
  ): Promise<void>;
  getState(): RealtimeControllerState;
  on<Key extends keyof import("../controller/RealtimeEvents").RealtimeEvents>(
    event: Key,
    handler: (detail: import("../controller/RealtimeEvents").RealtimeEvents[Key]) => void
  ): () => void;
  off<Key extends keyof import("../controller/RealtimeEvents").RealtimeEvents>(
    event: Key,
    handler: (detail: import("../controller/RealtimeEvents").RealtimeEvents[Key]) => void
  ): void;
}

/**
 * Typed Alpine flavor the plugin uses for `Alpine.store` and
 * `Alpine.magic`. The base `Alpine` type from `alpinejs` is not
 * generic, so the plugin's runtime surface falls back to the
 * toolkit's `AlpineLifecycleHost` extension. Consumers that need
 * typed `Alpine.store("realtime")` access can use this directly.
 */
export type RealtimeAlpine = Alpine & {
  cleanup?: (callback: () => void) => void;
};

/**
 * Result of {@link realtimePlugin}'s `defaultConfig` factory —
 * the callback Alpine sees via `alpine.plugin(realtimePlugin())`.
 */
export type RealtimePluginCallback = (alpine: Alpine) => void;

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
  return function registerRealtime(alpine: Alpine): void {
    const typedAlpine = alpine as unknown as RealtimeAlpine;
    const storeKey = resolveStoreKey(defaultConfig);
    const magicKey = defaultConfig.magicKey ?? REALTIME_MAGIC_KEY;
    const controller = new RealtimeController({ ...defaultConfig, id: storeKey });

    const store: RealtimeStore = createRealtimeStore(controller);
    const magic = createRealtimeMagic(controller);

    bridgeControllerStore<RealtimeStore, RealtimeController & Destroyable>({
      alpine: typedAlpine,
      storeKey,
      store,
      controller: controller as RealtimeController & Destroyable,
      magicKey,
      packageName: "realtime",
      magicAccessor: () => magic,
      subscribe: (reactiveStore) =>
        controller.on("statuschange", (state) => {
          reactiveStore.state = state;
        }),
    });

    // Async adapter resolution. The plugin stays sync — the
    // controller's `connect()` will surface a clear
    // ADAPTER_ERROR if a user calls it before this promise
    // resolves.
    void resolveAdapter(defaultConfig).then(
      (adapter) => {
        if (controller.isDestroyed) {
          void Promise.resolve(adapter.destroy()).catch(() => undefined);
          return;
        }
        void controller.setAdapter(adapter).catch(() => {
          // setAdapter() already transitions the controller to
          // the `failed` state and emits the underlying error;
          // we don't need to forward the rejection here.
        });
      },
      () => {
        // SSR — no EventSource / WebSocket available. The
        // controller's `connect()` will surface the failure
        // through the typed `error` event when (if) the user
        // calls it, so we don't emit anything here.
      }
    );
  };
}

/**
 * Default export for `Alpine.plugin(realtimePlugin())` style
 * imports.
 */
export default realtimePlugin;

/**
 * Build the typed `$store.realtime` snapshot. The store mirrors
 * the controller's frozen `state` snapshot and exposes the
 * `isReady` convenience getter used by templates.
 */
export function createRealtimeStore(controller: RealtimeController): RealtimeStore {
  return {
    state: controller.state,
    get isReady(): boolean {
      return controller.state.status === "connected";
    },
  };
}

/**
 * Build the typed `$realtime` magic. The magic mirrors the
 * controller's command surface; consumers can call
 * `$realtime.subscribe(...)` from a template or a JS callback.
 *
 * The `connect(overrides?)` argument is reserved for v0.2.0 —
 * the controller's `connect()` takes no overrides today, so the
 * parameter is accepted for API stability and ignored.
 */
export function createRealtimeMagic(controller: RealtimeController): RealtimeMagic {
  return {
    controller,
    get state(): RealtimeControllerState {
      return controller.state;
    },
    get isReady(): boolean {
      return controller.state.status === "connected";
    },
    async connect(_overrides?: RealtimeControllerConfig): Promise<void> {
      await controller.connect();
    },
    async disconnect(): Promise<void> {
      await controller.disconnect();
    },
    async pause(): Promise<void> {
      await controller.pause();
    },
    async resume(): Promise<void> {
      await controller.resume();
    },
    async destroy(): Promise<void> {
      await controller.destroy();
    },
    subscribe: (channel, handler) => controller.subscribe(channel, handler),
    unsubscribe: (channel, handler) => controller.unsubscribe(channel, handler),
    publish: (channel, message) => controller.publish(channel, message),
    getState: () => controller.state,
    on: (event, handler) => controller.on(event, handler),
    off: (event, handler) => controller.off(event, handler),
  };
}

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
 * Resolve the Alpine store key from the config. Falls back to
 * {@link REALTIME_STORE_KEY} when the controller's `id` is left
 * unset.
 */
function resolveStoreKey(config: RealtimeControllerConfig): string {
  if (typeof config.id === "string" && config.id.length > 0) {
    return config.id;
  }
  return REALTIME_STORE_KEY;
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
