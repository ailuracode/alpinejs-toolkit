/**
 * Stopwatch formatter with sub-second precision.
 */

import { formatPattern, toDurationParts } from "./format-pattern.js";
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
  const parts = toDurationParts(elapsed);
  return {
    ...parts,
    elapsed,
    remaining: null,
  };
}
