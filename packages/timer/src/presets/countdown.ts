/**
 * Countdown preset — `direction: 'down'` with a required duration.
 */

import { createTimer } from "../create-timer.js";
import { defaultDurationFormatter } from "../format-duration.js";
import type { CountdownOptions, TimerController } from "../types.js";

export function countdown(options: CountdownOptions): TimerController {
  return createTimer({
    ...options,
    direction: "down",
    format: options.format ?? defaultDurationFormatter,
  });
}
