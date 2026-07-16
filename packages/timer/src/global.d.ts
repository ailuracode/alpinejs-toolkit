/**
 * Ambient type surface for `@ailuracode/alpine-timer`.
 */

/// <reference types="@types/alpinejs" />

import type { TimerMagic } from "./types.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $timer: TimerMagic;
    }
  }
}

export type {
  CountdownOptions,
  CountupOptions,
  CreateTimerOptions,
  StopwatchController,
  StopwatchLap,
  StopwatchOptions,
  StopwatchReactiveView,
  TimerController,
  TimerDirection,
  TimerFormatParts,
  TimerFormatter,
  TimerMagic,
  TimerReactiveView,
  TimerSnapshot,
} from "./types.js";
