/**
 * Read-only controller state.
 *
 * Implementation lives in
 * `../controller/RealtimeControllerState`; this file is a thin
 * re-export so consumers that import the older path keep
 * working through the v0.1.0 series.
 *
 * @module
 */

export {
  type ConnectionState,
  getRealtimeControllerState,
  type RealtimeControllerState,
  type RealtimeTransportName,
} from "../controller/RealtimeControllerState";
