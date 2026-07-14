import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeartbeatManager } from "../src/utils/heartbeat";

interface FakeTimers {
  setInterval: (handler: () => void, intervalMs: number) => number;
  clearInterval: (handle: number) => void;
  setTimeout: (handler: () => void, delayMs: number) => number;
  clearTimeout: (handle: number) => void;
}

function createFakeTimers(): FakeTimers & {
  advance: (ms: number) => void;
  pendingIntervals: () => number[];
  pendingTimeouts: () => number[];
} {
  let nextInterval = 1;
  let nextTimeout = 100;
  const intervals = new Map<number, { every: number; handler: () => void; elapsed: number }>();
  const timeouts = new Map<number, { remaining: number; handler: () => void }>();

  const setInterval = (handler: () => void, intervalMs: number): number => {
    const handle = nextInterval++;
    intervals.set(handle, { every: intervalMs, handler, elapsed: 0 });
    return handle;
  };

  const clearInterval = (handle: number): void => {
    intervals.delete(handle);
  };

  const setTimeout = (handler: () => void, delayMs: number): number => {
    const handle = nextTimeout++;
    timeouts.set(handle, { remaining: delayMs, handler });
    return handle;
  };

  const clearTimeout = (handle: number): void => {
    timeouts.delete(handle);
  };

  const nextStep = (remaining: number): number => {
    let minStep = remaining;
    for (const interval of intervals.values()) {
      const toFire = interval.every - (interval.elapsed % interval.every);
      if (toFire > 0 && toFire < minStep) {
        minStep = toFire;
      }
    }
    for (const timeout of timeouts.values()) {
      if (timeout.remaining < minStep) {
        minStep = timeout.remaining;
      }
    }
    return minStep;
  };

  const advanceClocks = (step: number): void => {
    for (const interval of intervals.values()) {
      interval.elapsed += step;
    }
    for (const timeout of timeouts.values()) {
      timeout.remaining -= step;
    }
  };

  const fireTimeouts = (): void => {
    const fired: number[] = [];
    for (const [handle, timeout] of timeouts.entries()) {
      if (timeout.remaining <= 0) {
        fired.push(handle);
      }
    }
    for (const handle of fired) {
      const entry = timeouts.get(handle);
      timeouts.delete(handle);
      entry?.handler();
    }
  };

  const fireIntervals = (): void => {
    const fired: number[] = [];
    for (const [handle, interval] of intervals.entries()) {
      if (interval.elapsed >= interval.every && interval.elapsed % interval.every === 0) {
        fired.push(handle);
      }
    }
    for (const handle of fired) {
      const entry = intervals.get(handle);
      entry?.handler();
    }
  };

  const advance = (ms: number): void => {
    let remaining = ms;
    while (remaining > 0) {
      const minStep = nextStep(remaining);
      if (!Number.isFinite(minStep) || minStep <= 0) {
        break;
      }
      advanceClocks(minStep);
      fireTimeouts();
      fireIntervals();
      remaining -= minStep;
    }
  };

  return {
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    advance,
    pendingIntervals: () => [...intervals.keys()],
    pendingTimeouts: () => [...timeouts.keys()],
  };
}

describe("HeartbeatManager", () => {
  let timers: ReturnType<typeof createFakeTimers>;
  let manager: HeartbeatManager;

  beforeEach(() => {
    timers = createFakeTimers();
    manager = new HeartbeatManager(timers);
  });

  afterEach(() => {
    manager.stop();
  });

  it("fires ping at the configured interval", async () => {
    const sendHeartbeat = vi.fn().mockResolvedValue(undefined);
    const onTimeout = vi.fn();

    manager.start(sendHeartbeat, onTimeout, 100, 0);

    timers.advance(100);
    await Promise.resolve();
    await Promise.resolve();
    timers.advance(100);
    await Promise.resolve();
    await Promise.resolve();

    expect(sendHeartbeat).toHaveBeenCalledTimes(2);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("reports timeout when no pong arrives within timeoutMs", async () => {
    const sendHeartbeat = vi.fn().mockResolvedValue(undefined);
    const onTimeout = vi.fn();

    manager.start(sendHeartbeat, onTimeout, 100, 50);

    timers.advance(100); // ping fires
    await Promise.resolve();
    await Promise.resolve();
    timers.advance(50); // timeout fires

    expect(sendHeartbeat).toHaveBeenCalledTimes(1);
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("resets the timeout watchdog when recordPong is called", async () => {
    const sendHeartbeat = vi.fn().mockResolvedValue(undefined);
    const onTimeout = vi.fn();

    manager.start(sendHeartbeat, onTimeout, 100, 50);

    timers.advance(100); // ping fires at t=100, timeout armed for t=150
    await Promise.resolve();
    await Promise.resolve();
    timers.advance(40); // t=140
    manager.recordPong(); // clears timeout
    timers.advance(40); // t=180
    expect(onTimeout).not.toHaveBeenCalled();

    // Next interval fires at t=200; advance just enough to fire it.
    timers.advance(20); // t=200, ping fires, timeout armed for t=250
    await Promise.resolve();
    await Promise.resolve();
    // Stay safely below the new timeout window.
    timers.advance(40); // t=240
    expect(onTimeout).not.toHaveBeenCalled();

    // Cross the new timeout window.
    timers.advance(20); // t=260 — timeout fires at t=250
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("records RTT after a pong", async () => {
    manager.setNow(() => 1_000);
    const sendHeartbeat = vi.fn().mockResolvedValue(undefined);
    const onTimeout = vi.fn();

    manager.start(sendHeartbeat, onTimeout, 100, 0);

    manager.setNow(() => 1_050);
    timers.advance(100); // emits ping at t=1050
    await Promise.resolve();
    await Promise.resolve();
    manager.setNow(() => 1_080);
    manager.recordPong();

    expect(manager.stats.lastPingAt).toBe(1_050);
    expect(manager.stats.lastPongAt).toBe(1_080);
    expect(manager.stats.lastRttMs).toBe(30);
  });

  it("stop() clears timers and is idempotent", () => {
    const sendHeartbeat = vi.fn().mockResolvedValue(undefined);
    const onTimeout = vi.fn();

    manager.start(sendHeartbeat, onTimeout, 100, 50);
    manager.stop();
    timers.advance(500);

    expect(sendHeartbeat).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
    expect(manager.isRunning).toBe(false);

    expect(() => manager.stop()).not.toThrow();
  });

  it("start() is idempotent when already running", async () => {
    const first = vi.fn().mockResolvedValue(undefined);
    const second = vi.fn().mockResolvedValue(undefined);

    manager.start(first, () => undefined, 100, 0);
    manager.start(second, () => undefined, 100, 0);

    timers.advance(100);
    await Promise.resolve();
    await Promise.resolve();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });

  it("disables pings when intervalMs is 0", () => {
    const sendHeartbeat = vi.fn().mockResolvedValue(undefined);
    const onTimeout = vi.fn();

    manager.start(sendHeartbeat, onTimeout, 0, 100);
    timers.advance(500);

    expect(sendHeartbeat).not.toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("disables the timeout watchdog when timeoutMs is 0", async () => {
    const sendHeartbeat = vi.fn().mockResolvedValue(undefined);
    const onTimeout = vi.fn();

    manager.start(sendHeartbeat, onTimeout, 100, 0);

    timers.advance(100); // ping fires
    await Promise.resolve();
    await Promise.resolve();
    timers.advance(50_000);

    expect(sendHeartbeat).toHaveBeenCalled();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("validates interval and timeout inputs", () => {
    expect(() => manager.start(vi.fn(), vi.fn(), -1, 100)).toThrow(RangeError);
    expect(() => manager.start(vi.fn(), vi.fn(), 100, -1)).toThrow(RangeError);
    expect(() => manager.start(vi.fn(), vi.fn(), Number.NaN, 100)).toThrow(RangeError);
    expect(() => manager.start(vi.fn(), vi.fn(), Number.POSITIVE_INFINITY, 100)).toThrow(
      RangeError
    );
  });

  it("recordPong is a no-op after stop()", () => {
    const sendHeartbeat = vi.fn().mockResolvedValue(undefined);
    manager.start(sendHeartbeat, () => undefined, 100, 0);
    manager.stop();
    manager.recordPong();

    expect(manager.stats.lastPongAt).toBeNull();
  });
});
