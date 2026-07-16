/**
 * Stopwatch controller — lap state layered on the shared timer engine.
 */

import { generateId, ToolkitError } from "@ailuracode/alpine-core";
import type { TimerControllerImpl } from "./create-timer.js";
import { syncReactiveTimerView } from "./create-timer.js";
import { createFormat } from "./format-pattern.js";
import { buildStopwatchFormatParts, defaultStopwatchFormatter } from "./format-stopwatch.js";
import type {
  StopwatchController,
  StopwatchLap,
  StopwatchOptions,
  TimerFormatter,
} from "./types.js";

type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

export interface StopwatchReactiveShape extends StopwatchController {
  readonly isMounted: boolean;
  readonly isDestroyed: boolean;
}

export function createStopwatchController(
  timer: TimerControllerImpl,
  options: StopwatchOptions = {}
): StopwatchReactiveShape {
  const lapFormat = resolveLapFormat(options);
  const onLap = options.onLap;

  let laps: StopwatchLap[] = [];
  let hasStarted = false;

  const syncLaps = (view: Writable<StopwatchReactiveShape>): void => {
    view.laps = [...laps];
    view.lastLap = laps.length > 0 ? (laps[laps.length - 1] ?? null) : null;
    view.fastestLap = resolveExtremeLap(laps, "fastest");
    view.slowestLap = resolveExtremeLap(laps, "slowest");
  };

  const view: Writable<StopwatchReactiveShape> = {
    id: timer.id,
    direction: timer.direction,
    running: timer.running,
    paused: timer.paused,
    completed: timer.completed,
    elapsed: timer.elapsed,
    remaining: timer.remaining,
    duration: timer.duration,
    progress: timer.progress,
    formatted: timer.formatted,
    iteration: timer.iteration,
    isMounted: timer.isMounted,
    isDestroyed: timer.isDestroyed,
    laps: [],
    lastLap: null,
    fastestLap: null,
    slowestLap: null,
    start() {
      timer.start();
      hasStarted = true;
      syncReactiveTimerView(view as never, timer);
    },
    pause() {
      timer.pause();
      syncReactiveTimerView(view as never, timer);
    },
    resume() {
      timer.resume();
      syncReactiveTimerView(view as never, timer);
    },
    toggle() {
      timer.toggle();
      if (timer.running) {
        hasStarted = true;
      }
      syncReactiveTimerView(view as never, timer);
    },
    reset() {
      timer.reset();
      laps = [];
      hasStarted = false;
      syncReactiveTimerView(view as never, timer);
      syncLaps(view);
    },
    restart() {
      timer.restart();
      laps = [];
      hasStarted = true;
      syncReactiveTimerView(view as never, timer);
      syncLaps(view);
    },
    dispose() {
      timer.dispose();
      syncReactiveTimerView(view as never, timer);
    },
    lap() {
      if (!(timer.running && hasStarted)) {
        return null;
      }

      const elapsed = timer.elapsed;
      const previousElapsed = laps.length > 0 ? (laps[laps.length - 1]?.elapsed ?? 0) : 0;
      const split = elapsed - previousElapsed;
      const lapRecord = createLapRecord(laps.length + 1, elapsed, split, lapFormat);
      laps = [...laps, lapRecord];
      onLap?.(lapRecord, view);
      syncLaps(view);
      return lapRecord;
    },
    removeLap(id) {
      const next = laps.filter((entry) => entry.id !== id);
      if (next.length === laps.length) {
        return false;
      }
      laps = next;
      syncLaps(view);
      return true;
    },
    clearLaps() {
      laps = [];
      syncLaps(view);
    },
    format(pattern, options) {
      return timer.format(pattern, options);
    },
  };

  syncLaps(view);
  return view;
}

function createLapRecord(
  index: number,
  elapsed: number,
  split: number,
  lapFormat: TimerFormatter
): StopwatchLap {
  const id = generateId("lap");
  return {
    id,
    index,
    elapsed,
    split,
    formatted: lapFormat(buildStopwatchFormatParts(elapsed)),
    splitFormatted: lapFormat(buildStopwatchFormatParts(split)),
  };
}

function resolveExtremeLap(
  laps: readonly StopwatchLap[],
  mode: "fastest" | "slowest"
): StopwatchLap | null {
  if (laps.length === 0) {
    return null;
  }

  let selected = laps[0] ?? null;
  for (const lap of laps) {
    if (!selected) {
      selected = lap;
      continue;
    }

    if (mode === "fastest") {
      if (lap.split < selected.split) {
        selected = lap;
      }
      continue;
    }

    if (lap.split > selected.split) {
      selected = lap;
    }
  }

  return selected;
}

function resolveLapFormat(options: StopwatchOptions): TimerFormatter {
  if (options.lapFormat && options.lapFormatPattern) {
    throw new ToolkitError(
      "Provide either lapFormat or lapFormatPattern, not both.",
      "TOOLKIT_INVALID_ARGUMENT"
    );
  }

  if (options.lapFormat) {
    return options.lapFormat;
  }

  if (options.lapFormatPattern) {
    return createFormat(options.lapFormatPattern, {
      field: options.lapFormatPatternOptions?.field ?? "elapsed",
    });
  }

  return defaultStopwatchFormatter;
}

export function syncStopwatchView(view: Writable<StopwatchReactiveShape>): void {
  view.laps = [...view.laps];
}
