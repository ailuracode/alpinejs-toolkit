/**
 * Stopwatch preset — unlimited countup with lap recording.
 */

import { createStopwatchController } from "../create-stopwatch-controller.js";
import { createTimer } from "../create-timer.js";
import { defaultStopwatchFormatter } from "../format-stopwatch.js";
import type { CreateTimerOptions, StopwatchController, StopwatchOptions } from "../types.js";

/** Resolves timer options for stopwatch without conflicting format + formatPattern. */
export function buildStopwatchTimerOptions(options: StopwatchOptions = {}): CreateTimerOptions {
  const {
    lapFormat: _lapFormat,
    lapFormatPattern: _lapFormatPattern,
    lapFormatPatternOptions: _lapFormatPatternOptions,
    onLap: _onLap,
    ...timerOptions
  } = options;

  const usesCustomFormat = timerOptions.format || timerOptions.formatPattern;

  return {
    ...timerOptions,
    direction: "up",
    ...(!usesCustomFormat ? { format: defaultStopwatchFormatter } : {}),
  };
}

export function stopwatch(options: StopwatchOptions = {}): StopwatchController {
  const timer = createTimer(buildStopwatchTimerOptions(options));

  return createStopwatchController(timer, options);
}
