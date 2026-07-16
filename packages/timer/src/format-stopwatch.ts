/**
 * Stopwatch formatter with sub-second precision.
 */

import { formatPattern } from "./format-pattern.js";
import type { TimerFormatParts, TimerFormatter } from "./types.js";

/** Formats milliseconds as `mm:ss.SSS`. */
export function formatStopwatch(ms: number): string {
  return formatPattern("mm:ss.SSS", ms);
}

/** Default stopwatch formatter with sub-second precision. */
export const defaultStopwatchFormatter: TimerFormatter = (parts) => {
  return formatStopwatch(parts.elapsed);
};

export function buildStopwatchFormatParts(elapsed: number): TimerFormatParts {
  const safe = Math.max(0, elapsed);
  const totalSeconds = (safe / 1000) | 0;
  return {
    hours: (totalSeconds / 3600) | 0,
    minutes: ((totalSeconds % 3600) / 60) | 0,
    seconds: totalSeconds % 60,
    milliseconds: safe % 1000,
    elapsed,
    remaining: null,
  };
}
