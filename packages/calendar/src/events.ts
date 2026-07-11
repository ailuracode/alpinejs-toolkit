/**
 * Strongly-typed event map for the calendar controller.
 */

import type { CalendarMode, CalendarSelection } from "./types.js";

/** Detail payload for the `select` event. */
export interface CalendarSelectDetail {
  readonly date: Date | null;
  readonly mode: CalendarMode;
  readonly selected: CalendarSelection;
}

/** Detail payload for the `monthChange` event. */
export interface CalendarMonthChangeDetail {
  readonly month: Date;
}

/**
 * Event map for calendar state changes.
 *
 * - `select` — selection changed (after state update)
 * - `monthChange` — visible month navigated (after state update)
 * - `clear` — selection cleared (after state update)
 */
export interface CalendarEvents extends Record<string, unknown> {
  select: CalendarSelectDetail;
  monthChange: CalendarMonthChangeDetail;
  clear: undefined;
}
