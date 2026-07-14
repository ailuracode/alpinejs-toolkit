/**
 * Public utility surface for `@ailuracode/alpine-realtime`.
 *
 * Mirrors the layout used in sibling packages: implementations live
 * in this directory, this barrel only re-exports them. Consumers
 * import named bindings from `@ailuracode/alpine-realtime` rather
 * than from sub-paths.
 */

export {
  type BackoffConfig,
  calculateBackoff,
  DEFAULT_BACKOFF_CONFIG,
} from "./backoff";
export {
  HeartbeatManager,
  type HeartbeatStats,
  type HeartbeatTimers,
} from "./heartbeat";
export {
  type ReconnectConfig,
  type ReconnectDecision,
  ReconnectManager,
  type ReconnectPredicate,
  type ReconnectRandom,
  type ReconnectTimers,
} from "./reconnect";
export {
  type VisibilityDocument,
  VisibilityManager,
  type VisibilityResolution,
} from "./visibility";
