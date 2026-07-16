/**
 * Default mm:ss duration formatter.
 */

import type { TimerFormatParts, TimerFormatter } from "./types.js";

function toDurationParts(
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

/** Formats milliseconds as `mm:ss`. */
export function formatDuration(ms: number): string {
  const { minutes, seconds } = toDurationParts(ms);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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
