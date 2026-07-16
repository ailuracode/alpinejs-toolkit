/**
 * Typed event map for the timer controller.
 */

import type { TimerSnapshot } from "./types.js";

export interface TimerEvents extends Record<string, unknown> {
  readonly tick: TimerSnapshot;
  readonly complete: TimerSnapshot;
}
