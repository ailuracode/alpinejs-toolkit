/**
 * Strongly-typed event map for the tabs controller.
 */

import type { TabsChangeDetail } from "./types";

/**
 * Event map for tabs state changes. Single-key contract:
 * every transition emits `change` with the same
 * {@link TabsChangeDetail} payload.
 */
export interface TabsEvents extends Record<string, unknown> {
  change: TabsChangeDetail;
}
