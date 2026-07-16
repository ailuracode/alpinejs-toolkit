/**
 * Alpine.js integration for `@ailuracode/alpine-timer`.
 */

import { guardMagic, type Unsubscribe } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";
import {
  createStopwatchController,
  type StopwatchReactiveShape,
  syncStopwatchView,
} from "./create-stopwatch-controller.js";
import {
  buildReactiveTimerView,
  createTimer,
  syncReactiveTimerView,
  type TimerControllerImpl,
} from "./create-timer.js";
import { countdown as countdownPreset } from "./presets/countdown.js";
import { countup as countupPreset } from "./presets/countup.js";
import { stopwatch as stopwatchPreset } from "./presets/stopwatch.js";
import type {
  CountdownOptions,
  CountupOptions,
  CreateTimerOptions,
  CreateTimerPluginOptions,
  StopwatchOptions,
  StopwatchReactiveView,
  TimerAlpine,
  TimerMagic,
  TimerPluginCallback,
  TimerReactiveView,
} from "./types.js";
import { DEFAULT_TIMER_MAGIC_KEY } from "./types.js";

interface RegistryEntry {
  readonly controller: { destroy(): void };
  readonly cleanups: readonly Unsubscribe[];
}

export function timerPlugin(options: CreateTimerPluginOptions = {}): TimerPluginCallback {
  const magicKey = options.magicKey ?? DEFAULT_TIMER_MAGIC_KEY;

  return function registerTimer(alpine: AlpineBase): void {
    const Alpine = alpine as unknown as TimerAlpine;
    const registry = new Map<string, RegistryEntry>();

    const registerInstance = (
      id: string,
      controller: TimerControllerImpl,
      view: TimerReactiveView | StopwatchReactiveView,
      extraCleanups: readonly Unsubscribe[] = []
    ): TimerReactiveView | StopwatchReactiveView => {
      const unsubscribeTick = controller.on("tick", () => {
        syncReactiveTimerView(view, controller);
        if ("laps" in view) {
          syncStopwatchView(view as StopwatchReactiveShape);
        }
      });

      const unsubscribeComplete = controller.on("complete", () => {
        syncReactiveTimerView(view, controller);
      });

      registry.set(id, {
        controller,
        cleanups: [...extraCleanups, unsubscribeTick, unsubscribeComplete],
      });

      return view;
    };

    const createReactiveTimer = (options?: CreateTimerOptions): TimerReactiveView => {
      const controller = createTimer(options);
      const view = Alpine.reactive(buildReactiveTimerView(controller)) as TimerReactiveView;
      return registerInstance(controller.id, controller, view) as TimerReactiveView;
    };

    const createReactiveCountdown = (options: CountdownOptions): TimerReactiveView => {
      const controller = countdownPreset(options) as TimerControllerImpl;
      const view = Alpine.reactive(buildReactiveTimerView(controller)) as TimerReactiveView;
      return registerInstance(controller.id, controller, view) as TimerReactiveView;
    };

    const createReactiveCountup = (options?: CountupOptions): TimerReactiveView => {
      const controller = countupPreset(options) as TimerControllerImpl;
      const view = Alpine.reactive(buildReactiveTimerView(controller)) as TimerReactiveView;
      return registerInstance(controller.id, controller, view) as TimerReactiveView;
    };

    const createReactiveStopwatch = (options?: StopwatchOptions): StopwatchReactiveView => {
      const timer = createTimer({
        ...options,
        direction: "up",
      });
      const stopwatch = createStopwatchController(timer, options);
      const view = Alpine.reactive(stopwatch) as StopwatchReactiveView;
      return registerInstance(timer.id, timer, view) as StopwatchReactiveView;
    };

    const magic: TimerMagic = {
      create: createReactiveTimer,
      countdown: createReactiveCountdown,
      countup: createReactiveCountup,
      stopwatch: createReactiveStopwatch,
    };

    guardMagic(Alpine, magicKey, () => magic, "timer");

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => {
        for (const entry of registry.values()) {
          for (let index = entry.cleanups.length - 1; index >= 0; index -= 1) {
            entry.cleanups[index]?.();
          }
          entry.controller.destroy();
        }
        registry.clear();
      });
    }
  };
}

export { createStopwatchController } from "./create-stopwatch-controller.js";
export { createTimer } from "./create-timer.js";
export { countdownPreset as countdown, countupPreset as countup, stopwatchPreset as stopwatch };
