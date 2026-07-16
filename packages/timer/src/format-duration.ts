/**
 * Default mm:ss duration formatter.
 */

import { formatPattern, toDurationParts } from "./format-pattern.js";
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
  const parts = toDurationParts(elapsed);
  return {
    ...parts,
    elapsed,
    remaining,
  };
}
