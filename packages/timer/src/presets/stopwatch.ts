/**
 * Stopwatch preset — unlimited countup with lap recording.
 */

import { createStopwatchController } from "../create-stopwatch-controller.js";
import { createTimer } from "../create-timer.js";
import { defaultStopwatchFormatter } from "../format-stopwatch.js";
import type { StopwatchController, StopwatchOptions } from "../types.js";

export function stopwatch(options: StopwatchOptions = {}): StopwatchController {
  const timer = createTimer({
    ...options,
    direction: "up",
    format: options.format ?? defaultStopwatchFormatter,
  });

  return createStopwatchController(timer, options);
}
