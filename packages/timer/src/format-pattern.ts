/**
 * Pattern-based time formatting (`mm:ss`, `hh:mm`, `hh:mm:ss`, …).
 */

import type { TimerFormatParts, TimerFormatter } from "./types.js";

export type TimerFormatPattern = string;

export type TimerFormatField = "elapsed" | "remaining" | "auto";

export interface FormatPatternOptions {
  /** Which timer value to format. `auto` prefers `remaining` when available. */
  readonly field?: TimerFormatField;
}

function pad2(value: number): string {
  return (value < 10 ? "0" : "") + value;
}

function pad3(value: number): string {
  return (value < 100 ? (value < 10 ? "00" : "0") : "") + value;
}

function splitMs(ms: number, includesHours: boolean) {
  const safe = Math.max(0, ms) | 0;
  const totalSeconds = (safe / 1000) | 0;
  return {
    hours: (totalSeconds / 3600) | 0,
    minutes: includesHours ? ((totalSeconds % 3600) / 60) | 0 : (totalSeconds / 60) | 0,
    seconds: totalSeconds % 60,
    milliseconds: safe % 1000,
  };
}

/** Formats milliseconds with a pattern such as `mm:ss`, `hh:mm`, or `hh:mm:ss.SSS`. */
export function formatPattern(pattern: TimerFormatPattern, ms: number): string {
  const includesHours = pattern.includes("h");
  const { hours, minutes, seconds, milliseconds } = splitMs(ms, includesHours);
  const hh = pad2(hours);
  const mm = pad2(minutes);
  const ss = pad2(seconds);
  const ml = pad3(milliseconds);

  switch (pattern) {
    case "mm:ss":
      return `${mm}:${ss}`;
    case "hh:mm":
      return `${hh}:${mm}`;
    case "hh:mm:ss":
      return `${hh}:${mm}:${ss}`;
    case "mm:ss.SSS":
    case "mm:ss.mmm":
      return `${mm}:${ss}.${ml}`;
    case "h:m:s":
      return `${hours}:${minutes}:${seconds}`;
    default:
      return `${mm}:${ss}`;
  }
}

function resolveFormatMilliseconds(parts: TimerFormatParts, field: TimerFormatField): number {
  return field === "elapsed" ? parts.elapsed : (parts.remaining ?? parts.elapsed);
}

/** Creates a timer formatter from a pattern string. */
export function createFormat(
  pattern: TimerFormatPattern,
  options: FormatPatternOptions = {}
): TimerFormatter {
  const field = options.field ?? "auto";
  return (parts) => formatPattern(pattern, resolveFormatMilliseconds(parts, field));
}
