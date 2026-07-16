/**
 * Countup preset — `direction: 'up'` with an optional limit.
 */

import { createTimer } from "../create-timer.js";
import { defaultDurationFormatter } from "../format-duration.js";
import type { CountupOptions, TimerController } from "../types.js";

export function countup(options: CountupOptions = {}): TimerController {
  const { limit, ...rest } = options;

  return createTimer({
    ...rest,
    direction: "up",
    duration: limit,
    format: options.format ?? defaultDurationFormatter,
  });
}
