/**
 * Public entrypoint for `@ailuracode/alpine-realtime`.
 *
 * Per `.cursor/rules/new-package.mdc` and `AGENTS.md`, this
 * file MUST only contain re-exports. Implementations live under
 * `./controller`, `./adapters`, `./utils`, and `./types`.
 *
 * The package ships five layers:
 *
 * 1. **Type contract** — `RealtimeMessage`, `RealtimeError`,
 *    `RealtimeControllerConfig`, `RealtimeControllerState`,
 *    `RealtimeTransportAdapter`, etc.
 * 2. **Pure utilities** — `calculateBackoff`, `ReconnectManager`,
 *    `HeartbeatManager`, `VisibilityManager`.
 * 3. **Controller** — `RealtimeController` (the headless core).
 * 4. **Adapters** — `SseTransportAdapter`, `WsTransportAdapter`,
 *    `createAutoTransport`, `createSseTransport`,
 *    `createWsTransport`. `createBroadcastChannelTransport` is
 *    reserved for v0.2.0.
 * 5. **Alpine wiring** — exposed through the `./alpine` subpath
 *    (`realtimePlugin`, `createRealtimeStore`, `createRealtimeMagic`).
 *    The public barrel does NOT re-export from `./alpine/` —
 *    architecture-check forbids it; consumers import from
 *    `@ailuracode/alpine-realtime/alpine` instead.
 *
 * NO browser globals are referenced at module evaluation —
 * adapters lazy-load `EventSource` / `WebSocket` only inside
 * `connect()` method bodies.
 */

// --- Public controller --------------------------------------------
export { RealtimeController } from "./controller";
// --- Alpine plugin default export ---------------------------------
// Re-exported through the main entrypoint so consumers can write
// `import realtime from "@ailuracode/alpine-realtime"` and drop
// it into `alpine.plugin([...])`. The typed `RealtimeStore` /
// `RealtimeMagic` surfaces are exposed through the dedicated
// `./alpine` subpath
// (`@ailuracode/alpine-realtime/alpine`).
export { default, realtimePlugin } from "./plugin/realtimePlugin";
// --- Public adapters ----------------------------------------------
// --- Public types --------------------------------------------------
export type {
  AutoTransportOptions,
  ConnectionState,
  NormalizedRealtimeControllerConfig,
  RealtimeAdapterEvent,
  RealtimeAdapterReadyState,
  RealtimeBackpressureDetail,
  RealtimeControllerConfig,
  RealtimeControllerState,
  RealtimeEvents,
  RealtimeHeartbeatDetail,
  RealtimeMessage,
  RealtimeMessageHandler,
  RealtimeMessageInit,
  RealtimeReconnectDetail,
  RealtimeRetryPredicate,
  RealtimeTransportAdapter,
  RealtimeTransportKind,
  RealtimeTransportName,
  SseEventSourceCtor,
  SseEventSourceLike,
  SseTransportAdapterOptions,
  TransportAdapterOptions,
  WsBinaryType,
  WsCtor,
  WsLike,
  WsTransportAdapterOptions,
} from "./types";
// --- Public errors -------------------------------------------------
// --- Public factories ---------------------------------------------
export {
  createAdapterError,
  createAutoTransport,
  createBroadcastChannelTransport,
  createConfigError,
  createHeartbeatTimeoutError,
  createMaxRetriesError,
  createParseError,
  createSendUnsupportedError,
  createSseTransport,
  createTransportError,
  createWsTransport,
  DEFAULT_REALTIME_CHANNEL,
  getRealtimeControllerState,
  isRealtimeMessage,
  isRealtimeMessageHandler,
  RealtimeError,
  type RealtimeErrorCode,
  SseTransportAdapter,
  validateRealtimeControllerConfig,
  WsTransportAdapter,
} from "./types";
// --- Public utilities ----------------------------------------------
export {
  type BackoffConfig,
  calculateBackoff,
  DEFAULT_BACKOFF_CONFIG,
  HeartbeatManager,
  type HeartbeatStats,
  type HeartbeatTimers,
  type ReconnectConfig,
  type ReconnectDecision,
  ReconnectManager,
  type ReconnectPredicate,
  type ReconnectRandom,
  type ReconnectTimers,
  type VisibilityDocument,
  VisibilityManager,
  type VisibilityResolution,
} from "./utils";
