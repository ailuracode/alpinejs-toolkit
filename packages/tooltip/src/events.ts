/**
 * Strongly-typed event map for the tooltip controller.
 */

import type { TooltipChangeDetail } from "./types";

/**
 * Event map for tooltip state changes. Single-key contract:
 * every transition emits `change` with the same
 * {@link TooltipChangeDetail} payload.
 */
export interface TooltipEvents extends Record<string, unknown> {
  change: TooltipChangeDetail;
}
