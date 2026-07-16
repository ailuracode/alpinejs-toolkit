/**
 * Normalizes and validates timer options.
 */

import { ToolkitError } from "@ailuracode/alpine-core";
import { defaultCountdownFormatter, defaultDurationFormatter } from "./format-duration.js";
import { createFormat } from "./format-pattern.js";
import type { CreateTimerOptions, TimerDirection, TimerFormatter } from "./types.js";

export interface NormalizedTimerOptions {
  readonly direction: TimerDirection;
  readonly duration: number | null;
  readonly initialElapsed: number;
  readonly autoStart: boolean;
  readonly precision: number;
  readonly repeat: boolean | number;
  readonly format: NonNullable<CreateTimerOptions["format"]>;
  readonly onTick?: CreateTimerOptions["onTick"];
  readonly onComplete?: CreateTimerOptions["onComplete"];
  readonly id?: string;
}

const DEFAULT_PRECISION = 16;

export function normalizeCreateTimerOptions(
  options: CreateTimerOptions = {}
): NormalizedTimerOptions {
  const direction = options.direction ?? "down";
  const duration = resolveDuration(direction, options.duration);
  const initialElapsed = normalizeNonNegative(options.initialElapsed ?? 0, "initialElapsed");

  if (duration !== null && initialElapsed > duration) {
    throw new ToolkitError("initialElapsed cannot exceed duration.", "TOOLKIT_INVALID_ARGUMENT");
  }

  const precision = options.precision ?? DEFAULT_PRECISION;
  if (precision <= 0) {
    throw new ToolkitError("precision must be a positive number.", "TOOLKIT_INVALID_ARGUMENT");
  }

  const repeat = options.repeat ?? false;
  if (typeof repeat === "number" && repeat < 0) {
    throw new ToolkitError(
      "repeat must be false, true, or a non-negative number.",
      "TOOLKIT_INVALID_ARGUMENT"
    );
  }

  if (options.format && options.formatPattern) {
    throw new ToolkitError(
      "Provide either format or formatPattern, not both.",
      "TOOLKIT_INVALID_ARGUMENT"
    );
  }

  const format = resolveTimerFormat(direction, options);

  return {
    direction,
    duration,
    initialElapsed,
    autoStart: options.autoStart ?? false,
    precision,
    repeat,
    format,
    onTick: options.onTick,
    onComplete: options.onComplete,
    id: options.id,
  };
}

function resolveTimerFormat(
  direction: TimerDirection,
  options: CreateTimerOptions
): TimerFormatter {
  if (options.format) {
    return options.format;
  }

  if (options.formatPattern) {
    return createFormat(options.formatPattern, {
      field:
        options.formatPatternOptions?.field ?? (direction === "down" ? "remaining" : "elapsed"),
    });
  }

  return direction === "down" ? defaultCountdownFormatter : defaultDurationFormatter;
}

function resolveDuration(direction: TimerDirection, duration: number | undefined): number | null {
  if (direction === "down") {
    if (duration === undefined) {
      throw new ToolkitError(
        "Countdown timers require a non-negative duration.",
        "TOOLKIT_INVALID_ARGUMENT"
      );
    }
    return normalizeNonNegative(duration, "duration");
  }

  if (duration === undefined) {
    return null;
  }

  return normalizeNonNegative(duration, "duration");
}

function normalizeNonNegative(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new ToolkitError(
      `${field} must be a non-negative finite number.`,
      "TOOLKIT_INVALID_ARGUMENT"
    );
  }
  return value;
}
