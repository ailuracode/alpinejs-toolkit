/**
 * Public type surface for `@ailuracode/alpine-realtime`.
 *
 * Per `[AGENTS.md](../../../../AGENTS.md)` and
 * `.cursor/rules/new-package.mdc`, this file is the only public
 * barrel for type definitions. Implementations live under
 * `./controller/` and `./adapters/`. This barrel re-exports
 * both with the stable `Realtime*` type names the package has
 * shipped since Phase 1.
 */

export type {
  AutoTransportOptions,
  RealtimeAdapterEvent,
  RealtimeAdapterReadyState,
  RealtimeTransportAdapter,
  SseEventSourceCtor,
  SseEventSourceLike,
  SseTransportAdapterOptions,
  TransportAdapterOptions,
  WsBinaryType,
  WsCtor,
  WsLike,
  WsTransportAdapterOptions,
} from "../adapters";
export {
  createAutoTransport,
  createBroadcastChannelTransport,
  createSseTransport,
  createWsTransport,
  SseTransportAdapter,
  WsTransportAdapter,
} from "../adapters";
export { RealtimeController } from "../controller/RealtimeController";
export type {
  NormalizedRealtimeControllerConfig,
  RealtimeControllerConfig,
  RealtimeRetryPredicate,
  RealtimeTransportKind,
} from "../controller/RealtimeControllerConfig";
export {
  DEFAULT_REALTIME_CHANNEL,
  isRealtimeMessage,
  isRealtimeMessageHandler,
  validateRealtimeControllerConfig,
} from "../controller/RealtimeControllerConfig";
export {
  type ConnectionState,
  getRealtimeControllerState,
  type RealtimeControllerState,
  type RealtimeTransportName,
} from "../controller/RealtimeControllerState";
export {
  createAdapterError,
  createConfigError,
  createHeartbeatTimeoutError,
  createMaxRetriesError,
  createParseError,
  createSendUnsupportedError,
  createTransportError,
  RealtimeError,
  type RealtimeErrorCode,
} from "../controller/RealtimeError";
export type {
  RealtimeBackpressureDetail,
  RealtimeEvents,
  RealtimeHeartbeatDetail,
  RealtimeReconnectDetail,
} from "../controller/RealtimeEvents";
export type {
  RealtimeMessage,
  RealtimeMessageHandler,
  RealtimeMessageInit,
} from "../controller/RealtimeMessage";
