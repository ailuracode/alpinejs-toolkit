/**
 * Public controller surface for `@ailuracode/alpine-realtime`.
 *
 * Per `.cursor/rules/new-package.mdc` and `AGENTS.md`, this
 * barrel MUST only contain re-exports. Implementations live
 * next to it (`./RealtimeController`, `./RealtimeControllerConfig`,
 * etc.). Consumers import named bindings from
 * `@ailuracode/alpine-realtime/controller` so they don't pull
 * the (future) plugin and Alpine adapter code.
 */

export { RealtimeController } from "./RealtimeController";
export type {
  NormalizedRealtimeControllerConfig,
  RealtimeControllerConfig,
  RealtimeRetryPredicate,
  RealtimeTransportKind,
} from "./RealtimeControllerConfig";
export {
  DEFAULT_REALTIME_CHANNEL,
  isRealtimeMessage,
  isRealtimeMessageHandler,
  validateRealtimeControllerConfig,
} from "./RealtimeControllerConfig";
export {
  type ConnectionState,
  getRealtimeControllerState,
  type RealtimeControllerState,
  type RealtimeTransportName,
} from "./RealtimeControllerState";
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
} from "./RealtimeError";
export type {
  RealtimeBackpressureDetail,
  RealtimeEvents,
  RealtimeHeartbeatDetail,
  RealtimeReconnectDetail,
} from "./RealtimeEvents";
export type {
  RealtimeMessage,
  RealtimeMessageHandler,
  RealtimeMessageInit,
} from "./RealtimeMessage";
