/**
 * Public entrypoint for `@ailuracode/alpine-timer`.
 */

export type { Unsubscribe } from "./core-deps.js";
export { createStopwatchController } from "./create-stopwatch-controller.js";
export { TimerControllerImpl } from "./create-timer.js";
export type { TimerEvents } from "./events.js";
export {
  defaultCountdownFormatter,
  defaultDurationFormatter,
  formatDuration,
} from "./format-duration.js";
export {
  createFormat,
  formatPattern,
} from "./format-pattern.js";
export { formatStopwatch } from "./format-stopwatch.js";
export {
  countdown,
  countup,
  createTimer,
  stopwatch,
  timerPlugin,
  timerPlugin as default,
} from "./plugin.js";
export type {
  CountdownOptions,
  CountupOptions,
  CreateTimerOptions,
  CreateTimerPluginOptions,
  FormatPatternOptions,
  StopwatchController,
  StopwatchLap,
  StopwatchOptions,
  StopwatchReactiveView,
  TimerAlpine,
  TimerController as TimerControllerSurface,
  TimerDirection,
  TimerFormatField,
  TimerFormatParts,
  TimerFormatPattern,
  TimerFormatter,
  TimerMagic,
  TimerPluginCallback,
  TimerReactiveView,
  TimerSnapshot,
  Writable,
} from "./types.js";
export { DEFAULT_TIMER_MAGIC_KEY } from "./types.js";
