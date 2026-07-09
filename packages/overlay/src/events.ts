/**
 * Event map for the overlay controller. Re-declared from
 * `types.ts` so the controller file does not import its own
 * re-exports (cleaner module boundary).
 */

import type { OverlayChangeDetail } from "./types.js";

export type { OverlayChangeDetail, OverlayChangeListener } from "./types.js";

export interface OverlayEvents extends Record<string, unknown> {
  change: OverlayChangeDetail;
}
