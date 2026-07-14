/**
 * Message envelope exchanged between adapters and the controller.
 *
 * Implementation lives in `../controller/RealtimeMessage`; this
 * file is a thin re-export so consumers that import the older
 * path keep working through the v0.1.0 series.
 *
 * @module
 */

export type {
  RealtimeMessage,
  RealtimeMessageHandler,
  RealtimeMessageInit,
} from "../controller/RealtimeMessage";
