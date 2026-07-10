/**
 * Strongly-typed event map for the accordion controller.
 */

import type { AccordionChangeDetail } from "./types";

/**
 * Event map for accordion state changes. Single-key contract:
 * every transition emits `change` with the same
 * {@link AccordionChangeDetail} payload.
 */
export interface AccordionEvents extends Record<string, unknown> {
  change: AccordionChangeDetail;
}
