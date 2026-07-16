/**
 * Default mm:ss duration formatter.
 */

import { formatPattern } from "./format-pattern.js";
import type { TimerFormatParts, TimerFormatter } from "./types.js";

/** Formats milliseconds as `mm:ss`. */
export function formatDuration(ms: number): string {
  return formatPattern("mm:ss", ms);
}

/** Default formatter for countup timers — displays elapsed time. */
export const defaultDurationFormatter: TimerFormatter = (parts) => {
  return formatDuration(parts.elapsed);
};

/** Default formatter for countdown timers — displays remaining time. */
export const defaultCountdownFormatter: TimerFormatter = (parts) => {
  const value = parts.remaining ?? parts.elapsed;
  return formatDuration(value);
};

export function buildFormatParts(elapsed: number, remaining: number | null): TimerFormatParts {
  const safe = Math.max(0, elapsed);
  const totalSeconds = (safe / 1000) | 0;
  return {
    hours: (totalSeconds / 3600) | 0,
    minutes: ((totalSeconds % 3600) / 60) | 0,
    seconds: totalSeconds % 60,
    milliseconds: safe % 1000,
    elapsed,
    remaining,
  };
}
