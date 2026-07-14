/**
 * Realtime error class and factory functions.
 *
 * Implementation lives in `../controller/RealtimeError`; this
 * file is a thin re-export so consumers that import the older
 * path keep working through the v0.1.0 series.
 *
 * @module
 */

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
