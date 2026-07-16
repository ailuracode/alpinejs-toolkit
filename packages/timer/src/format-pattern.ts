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

type FormatToken = "SSS" | "mmm" | "hh" | "mm" | "ss" | "h" | "m" | "s";

type PatternSegment =
  | { readonly type: "token"; readonly token: FormatToken }
  | { readonly type: "literal"; readonly value: string };

const TOKEN_ORDER: readonly FormatToken[] = ["SSS", "mmm", "hh", "mm", "ss", "h", "m", "s"];

const patternCache = new Map<string, readonly PatternSegment[]>();

function findTokenAt(pattern: string, index: number): FormatToken | null {
  for (const token of TOKEN_ORDER) {
    if (pattern.startsWith(token, index)) {
      return token;
    }
  }
  return null;
}

function readLiteral(
  pattern: string,
  startIndex: number
): { readonly literal: string; readonly nextIndex: number } {
  let literal = "";
  let index = startIndex;

  while (index < pattern.length) {
    if (findTokenAt(pattern, index)) {
      break;
    }

    literal += pattern[index] ?? "";
    index += 1;
  }

  return { literal, nextIndex: index };
}

function parsePattern(pattern: string): readonly PatternSegment[] {
  const cached = patternCache.get(pattern);
  if (cached) {
    return cached;
  }

  const segments: PatternSegment[] = [];
  let index = 0;

  while (index < pattern.length) {
    const token = findTokenAt(pattern, index);
    if (token) {
      segments.push({ type: "token", token });
      index += token.length;
      continue;
    }

    const { literal, nextIndex } = readLiteral(pattern, index);
    segments.push({ type: "literal", value: literal });
    index = nextIndex;
  }

  patternCache.set(pattern, segments);
  return segments;
}

function resolveDisplayParts(ms: number, includesHours: boolean) {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = includesHours
    ? Math.floor((totalSeconds % 3600) / 60)
    : Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = safe % 1000;

  return { hours, minutes, seconds, milliseconds };
}

function patternIncludesHours(segments: readonly PatternSegment[]): boolean {
  for (const segment of segments) {
    if (segment.type === "token" && (segment.token === "h" || segment.token === "hh")) {
      return true;
    }
  }
  return false;
}

function renderToken(token: FormatToken, parts: ReturnType<typeof resolveDisplayParts>): string {
  switch (token) {
    case "hh":
      return String(parts.hours).padStart(2, "0");
    case "h":
      return String(parts.hours);
    case "mm":
      return String(parts.minutes).padStart(2, "0");
    case "m":
      return String(parts.minutes);
    case "ss":
      return String(parts.seconds).padStart(2, "0");
    case "s":
      return String(parts.seconds);
    case "SSS":
    case "mmm":
      return String(parts.milliseconds).padStart(3, "0");
    default:
      return "";
  }
}

/** Formats milliseconds with a pattern such as `mm:ss`, `hh:mm`, or `hh:mm:ss.SSS`. */
export function formatPattern(pattern: TimerFormatPattern, ms: number): string {
  const segments = parsePattern(pattern);
  const includesHours = patternIncludesHours(segments);
  const parts = resolveDisplayParts(ms, includesHours);

  let output = "";
  for (const segment of segments) {
    if (segment.type === "literal") {
      output += segment.value;
      continue;
    }

    output += renderToken(segment.token, parts);
  }

  return output;
}

function resolveFormatMilliseconds(
  parts: TimerFormatParts,
  field: TimerFormatField = "auto"
): number {
  if (field === "elapsed") {
    return parts.elapsed;
  }

  if (field === "remaining") {
    return parts.remaining ?? parts.elapsed;
  }

  return parts.remaining ?? parts.elapsed;
}

/** Creates a timer formatter from a pattern string. */
export function createFormat(
  pattern: TimerFormatPattern,
  options: FormatPatternOptions = {}
): TimerFormatter {
  const field = options.field ?? "auto";
  return (parts) => formatPattern(pattern, resolveFormatMilliseconds(parts, field));
}

/**
 * Pattern-based formatting helper.
 *
 * - `format('mm:ss', 10_000)` formats milliseconds directly.
 * - `format('mm:ss')` returns a `TimerFormatter` for timer options.
 * - `format('mm:ss', { field: 'remaining' })` formats remaining time in timers.
 */
export function format(pattern: TimerFormatPattern, options?: FormatPatternOptions): TimerFormatter;
export function format(pattern: TimerFormatPattern, ms: number): string;
export function format(
  pattern: TimerFormatPattern,
  optionsOrMs?: FormatPatternOptions | number
): TimerFormatter | string {
  if (typeof optionsOrMs === "number") {
    return formatPattern(pattern, optionsOrMs);
  }

  return createFormat(pattern, optionsOrMs);
}

export function toDurationParts(
  ms: number
): Pick<TimerFormatParts, "hours" | "minutes" | "seconds" | "milliseconds"> {
  return resolveDisplayParts(ms, true);
}
