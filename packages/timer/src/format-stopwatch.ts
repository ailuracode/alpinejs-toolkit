/**
 * Stopwatch formatter with sub-second precision.
 */

import type { TimerFormatParts, TimerFormatter } from "./types.js";

function toStopwatchParts(
  ms: number
): Pick<TimerFormatParts, "hours" | "minutes" | "seconds" | "milliseconds"> {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = safe % 1000;

  return { hours, minutes, seconds, milliseconds };
}

/** Formats milliseconds as `mm:ss.mmm`. */
export function formatStopwatch(ms: number): string {
  const { minutes, seconds, milliseconds } = toStopwatchParts(ms);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

/** Default stopwatch formatter with sub-second precision. */
export const defaultStopwatchFormatter: TimerFormatter = (parts) => {
  return formatStopwatch(parts.elapsed);
};

export function buildStopwatchFormatParts(elapsed: number): TimerFormatParts {
  const parts = toStopwatchParts(elapsed);
  return {
    ...parts,
    elapsed,
    remaining: null,
  };
}
