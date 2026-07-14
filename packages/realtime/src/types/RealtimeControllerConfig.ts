/**
 * Public configuration surface for the realtime transport controller.
 *
 * The implementation lives in
 * `../controller/RealtimeControllerConfig`; this file is a
 * thin re-export so consumers that import the older path
 * (`@ailuracode/alpine-realtime/types/RealtimeControllerConfig`)
 * keep working through the v0.1.0 series.
 *
 * @module
 */

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
