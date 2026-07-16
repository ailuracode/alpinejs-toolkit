/**
 * Public type contracts for `@ailuracode/alpine-timer`.
 */

import type { PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";
import type { FormatPatternOptions, TimerFormatPattern } from "./format-pattern.js";

export type {
  FormatPatternOptions,
  TimerFormatField,
  TimerFormatPattern,
} from "./format-pattern.js";

export const DEFAULT_TIMER_MAGIC_KEY = "timer";

export type TimerDirection = "up" | "down";

export interface TimerFormatParts {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly milliseconds: number;
  readonly elapsed: number;
  readonly remaining: number | null;
}

export type TimerFormatter = (parts: TimerFormatParts) => string;

export interface TimerSnapshot {
  readonly direction: TimerDirection;
  readonly running: boolean;
  readonly paused: boolean;
  readonly completed: boolean;
  readonly elapsed: number;
  readonly remaining: number | null;
  readonly duration: number | null;
  readonly progress: number | null;
  readonly formatted: string;
  readonly iteration: number;
}

export interface TimerController {
  readonly id: string;
  readonly direction: TimerDirection;
  readonly running: boolean;
  readonly paused: boolean;
  readonly completed: boolean;
  readonly elapsed: number;
  readonly remaining: number | null;
  readonly duration: number | null;
  readonly progress: number | null;
  readonly formatted: string;
  readonly iteration: number;

  /** Formats the current timer state with a pattern such as `mm:ss` or `hh:mm`. */
  format(pattern: TimerFormatPattern, options?: FormatPatternOptions): string;

  start(): void;
  pause(): void;
  resume(): void;
  toggle(): void;
  reset(): void;
  restart(): void;
  dispose(): void;
}

export interface CreateTimerOptions {
  readonly direction?: TimerDirection;
  readonly duration?: number;
  readonly initialElapsed?: number;
  readonly autoStart?: boolean;
  readonly precision?: number;
  readonly repeat?: boolean | number;
  readonly format?: TimerFormatter;
  /** Pattern shorthand — e.g. `mm:ss`, `hh:mm`, `hh:mm:ss.SSS`. */
  readonly formatPattern?: TimerFormatPattern;
  readonly formatPatternOptions?: FormatPatternOptions;
  readonly onTick?: (timer: TimerSnapshot) => void;
  readonly onComplete?: (timer: TimerSnapshot) => void;
  readonly id?: string;
}

export interface CountdownOptions extends Omit<CreateTimerOptions, "direction"> {
  readonly duration: number;
}

export interface CountupOptions extends Omit<CreateTimerOptions, "direction" | "duration"> {
  readonly limit?: number;
}

export interface StopwatchLap {
  readonly id: string;
  readonly index: number;
  readonly elapsed: number;
  readonly split: number;
  readonly formatted: string;
  readonly splitFormatted: string;
}

export interface StopwatchOptions extends Omit<CountupOptions, "limit"> {
  readonly lapFormat?: TimerFormatter;
  readonly lapFormatPattern?: TimerFormatPattern;
  readonly lapFormatPatternOptions?: FormatPatternOptions;
  readonly onLap?: (lap: StopwatchLap, stopwatch: StopwatchController) => void;
}

export interface StopwatchController extends TimerController {
  readonly laps: readonly StopwatchLap[];
  readonly lastLap: StopwatchLap | null;
  readonly fastestLap: StopwatchLap | null;
  readonly slowestLap: StopwatchLap | null;

  lap(): StopwatchLap | null;
  removeLap(id: StopwatchLap["id"]): boolean;
  clearLaps(): void;
}

export interface TimerReactiveView extends TimerController {
  readonly isMounted: boolean;
  readonly isDestroyed: boolean;
}

export interface StopwatchReactiveView extends StopwatchController {
  readonly isMounted: boolean;
  readonly isDestroyed: boolean;
}

export interface TimerMagic {
  create(options?: CreateTimerOptions): TimerReactiveView;
  countdown(options: CountdownOptions): TimerReactiveView;
  countup(options?: CountupOptions): TimerReactiveView;
  stopwatch(options?: StopwatchOptions): StopwatchReactiveView;
}

export interface CreateTimerPluginOptions {
  readonly magicKey?: string;
}

export type TimerPluginCallback = PluginCallback;

export type TimerAlpine = AlpineBase & {
  reactive<T>(value: T): T;
  cleanup?(callback: () => void): void;
};

export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};
