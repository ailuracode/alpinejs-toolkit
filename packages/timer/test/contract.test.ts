/**
 * Contract tests for the published `@ailuracode/alpine-timer` entrypoint.
 */

import { describe, expect, it } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import timerPlugin, {
  countdown,
  countup,
  createTimer,
  formatDuration,
  formatStopwatch,
  stopwatch,
} from "../src/index.js";
import type { TimerMagic } from "../src/types.js";

describe("@ailuracode/alpine-timer contract", () => {
  it("imports the published entrypoint without throwing", () => {
    expect(timerPlugin).toBeTypeOf("function");
    expect(createTimer).toBeTypeOf("function");
    expect(countdown).toBeTypeOf("function");
    expect(countup).toBeTypeOf("function");
    expect(stopwatch).toBeTypeOf("function");
    expect(formatDuration(1_000)).toBe("00:01");
    expect(formatStopwatch(1_000)).toBe("00:01.000");
  });

  it("registers the timer magic factories", () => {
    const { timer } = createMagicHarness(timerPlugin()) as { timer: TimerMagic };
    const countdownTimer = timer.countdown({ duration: 1_000 });
    const countupTimer = timer.countup();
    const stopwatchTimer = timer.stopwatch();

    expect(countdownTimer.direction).toBe("down");
    expect(countupTimer.direction).toBe("up");
    expect(stopwatchTimer.laps).toEqual([]);
    expect(timer.create({ direction: "down", duration: 500 }).duration).toBe(500);
  });
});
