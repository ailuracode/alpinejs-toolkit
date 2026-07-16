/**
 * Controller tests for `@ailuracode/alpine-timer`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createStopwatchController } from "../src/create-stopwatch-controller.js";
import { TimerControllerImpl } from "../src/create-timer.js";
import { formatDuration } from "../src/format-duration.js";
import { formatStopwatch } from "../src/format-stopwatch.js";
import { countdown } from "../src/presets/countdown.js";
import { countup } from "../src/presets/countup.js";
import { stopwatch } from "../src/presets/stopwatch.js";
import type { MonotonicClock, Scheduler } from "../src/scheduler.js";

function createTestHarness(now = 0) {
  let current = now;
  const callbacks = new Map<ReturnType<typeof setInterval>, () => void>();

  const clock: MonotonicClock = {
    now: () => current,
  };

  const scheduler: Scheduler = {
    schedule(callback, intervalMs) {
      const handle = setInterval(callback, intervalMs);
      callbacks.set(handle, callback);
      return () => {
        clearInterval(handle);
        callbacks.delete(handle);
      };
    },
  };

  return {
    clock,
    scheduler,
    advance(ms: number) {
      current += ms;
      vi.advanceTimersByTime(ms);
    },
  };
}

describe("@ailuracode/alpine-timer controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down to completion without interval drift", () => {
    const harness = createTestHarness();
    const onComplete = vi.fn();
    const timer = new TimerControllerImpl(
      { direction: "down", duration: 1_000, precision: 100, onComplete },
      { clock: harness.clock, scheduler: harness.scheduler }
    );
    timer.mount();
    timer.start();

    harness.advance(400);
    expect(timer.elapsed).toBe(400);
    expect(timer.remaining).toBe(600);

    harness.advance(700);
    expect(timer.elapsed).toBe(1_000);
    expect(timer.completed).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("pauses and resumes from the frozen elapsed value", () => {
    const harness = createTestHarness();
    const timer = new TimerControllerImpl(
      { direction: "down", duration: 2_000, precision: 100 },
      { clock: harness.clock, scheduler: harness.scheduler }
    );
    timer.mount();
    timer.start();
    harness.advance(500);
    timer.pause();
    harness.advance(1_000);
    expect(timer.elapsed).toBe(500);
    timer.resume();
    harness.advance(500);
    expect(timer.elapsed).toBe(1_000);
  });

  it("does not restart a completed timer through start()", () => {
    const harness = createTestHarness();
    const onComplete = vi.fn();
    const timer = new TimerControllerImpl(
      { direction: "down", duration: 100, precision: 50, onComplete },
      { clock: harness.clock, scheduler: harness.scheduler }
    );
    timer.mount();
    timer.start();
    harness.advance(200);
    expect(timer.completed).toBe(true);
    timer.start();
    expect(timer.completed).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("restarts a completed timer through restart()", () => {
    const harness = createTestHarness();
    const onComplete = vi.fn();
    const timer = new TimerControllerImpl(
      { direction: "down", duration: 100, precision: 50, onComplete },
      { clock: harness.clock, scheduler: harness.scheduler }
    );
    timer.mount();
    timer.start();
    harness.advance(200);
    timer.restart();
    harness.advance(50);
    expect(timer.completed).toBe(false);
    expect(timer.running).toBe(true);
  });

  it("supports unlimited countup semantics", () => {
    const harness = createTestHarness();
    const timer = countup() as TimerControllerImpl;
    timer.start();
    harness.advance(1_500);
    expect(timer.elapsed).toBeGreaterThanOrEqual(1_400);
    expect(timer.remaining).toBeNull();
    expect(timer.progress).toBeNull();
    expect(timer.completed).toBe(false);
    timer.dispose();
  });

  it("supports limited countup completion", () => {
    const harness = createTestHarness();
    const onComplete = vi.fn();
    const timer = countup({ limit: 500, precision: 100, onComplete }) as TimerControllerImpl;
    timer.start();
    harness.advance(600);
    expect(timer.completed).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    timer.dispose();
  });

  it("repeats countdown iterations when repeat is enabled", () => {
    const harness = createTestHarness();
    const onComplete = vi.fn();
    const timer = new TimerControllerImpl(
      {
        direction: "down",
        duration: 100,
        precision: 50,
        repeat: 2,
        onComplete,
      },
      { clock: harness.clock, scheduler: harness.scheduler }
    );
    timer.mount();
    timer.start();
    harness.advance(120);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(timer.iteration).toBe(1);
    harness.advance(120);
    expect(onComplete).toHaveBeenCalledTimes(2);
    expect(timer.iteration).toBe(2);
    harness.advance(120);
    expect(onComplete).toHaveBeenCalledTimes(2);
  });

  it("formats countdown from remaining time", () => {
    const harness = createTestHarness();
    const timer = new TimerControllerImpl(
      { direction: "down", duration: 10_000, precision: 100 },
      { clock: harness.clock, scheduler: harness.scheduler }
    );
    timer.mount();
    expect(timer.formatted).toBe("00:10");
    timer.start();
    harness.advance(1_000);
    expect(timer.formatted).toBe("00:09");
    timer.dispose();
  });

  it("formats durations and stopwatch values", () => {
    expect(formatDuration(65_432)).toBe("01:05");
    expect(formatStopwatch(65_432)).toBe("01:05.432");
  });

  it("records stopwatch laps with split durations", () => {
    const harness = createTestHarness();
    const onLap = vi.fn();
    const timer = new TimerControllerImpl(
      { direction: "up", precision: 100 },
      { clock: harness.clock, scheduler: harness.scheduler }
    );
    timer.mount();
    const watch = createStopwatchController(timer, { onLap });
    watch.start();
    harness.advance(1_000);
    const first = watch.lap();
    harness.advance(500);
    const second = watch.lap();

    expect(first?.split).toBe(1_000);
    expect(second?.split).toBe(500);
    expect(onLap).toHaveBeenCalledTimes(2);
    expect(watch.fastestLap?.id).toBe(second?.id);
    expect(watch.slowestLap?.id).toBe(first?.id);
  });

  it("clears laps on reset and restart", () => {
    const harness = createTestHarness();
    const timer = new TimerControllerImpl(
      { direction: "up", precision: 100 },
      { clock: harness.clock, scheduler: harness.scheduler }
    );
    timer.mount();
    const watch = createStopwatchController(timer);
    watch.start();
    harness.advance(300);
    watch.lap();
    expect(watch.laps).toHaveLength(1);
    watch.reset();
    expect(watch.laps).toHaveLength(0);
    watch.start();
    harness.advance(200);
    watch.lap();
    watch.restart();
    expect(watch.laps).toHaveLength(0);
  });

  it("returns null when lapping before start", () => {
    const timer = countdown({ duration: 1_000 }) as TimerControllerImpl;
    const watch = stopwatch();
    expect(watch.lap()).toBeNull();
    timer.dispose();
    watch.dispose();
  });

  it("accepts formatPattern without conflicting with the stopwatch default formatter", () => {
    const watch = stopwatch({
      formatPattern: "mm:ss",
      lapFormatPattern: "mm:ss",
    });

    expect(watch.formatted).toBe("00:00");
    watch.dispose();
  });
});
