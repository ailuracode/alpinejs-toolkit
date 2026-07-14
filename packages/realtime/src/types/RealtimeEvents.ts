/**
 * Public event surface for the realtime controller.
 *
 * Implementation lives in `../controller/RealtimeEvents`; this
 * file is a thin re-export so consumers that import the older
 * path keep working through the v0.1.0 series.
 *
 * @module
 */

export type {
  RealtimeBackpressureDetail,
  RealtimeEvents,
  RealtimeHeartbeatDetail,
  RealtimeReconnectDetail,
} from "../controller/RealtimeEvents";
