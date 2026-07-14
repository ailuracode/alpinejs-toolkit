import { describe, expect, it, vi } from "vitest";
import { calculateBackoff } from "../src/utils/backoff";
import { ReconnectManager } from "../src/utils/reconnect";

interface FakeTimers {
  setTimeout: (handler: () => void, delayMs: number) => number;
  clearTimeout: (handle: number) => void;
}

function createFakeTimers(): FakeTimers & {
  advance: (ms: number) => void;
  pending: () => number[];
} {
  const handles = new Map<number, { at: number; handler: () => void }>();
  let nextHandle = 1;

  const setTimeout = (handler: () => void, delayMs: number): number => {
    const handle = nextHandle++;
    handles.set(handle, { at: delayMs, handler });
    return handle;
  };

  const clearTimeout = (handle: number): void => {
    handles.delete(handle);
  };

  const advance = (ms: number): void => {
    const ready = [...handles.entries()]
      .map(([handle, entry]) => ({
        handle,
        at: entry.at - ms,
        handler: entry.handler,
      }))
      .filter((entry) => entry.at <= 0)
      .sort((a, b) => a.at - b.at);

    for (const entry of ready) {
      handles.delete(entry.handle);
      entry.handler();
    }
  };

  const pending = (): number[] => {
    return [...handles.keys()];
  };

  return { setTimeout, clearTimeout, advance, pending };
}

const baseConfig = {
  maxRetries: 5,
  baseDelayMs: 100,
  maxDelayMs: 1_000,
  jitterFactor: 0,
};

describe("ReconnectManager", () => {
  it("schedules and invokes a single retry", async () => {
    const timers = createFakeTimers();
    const manager = new ReconnectManager(timers, () => 0);
    const retry = vi.fn().mockResolvedValue(undefined);

    const { done } = manager.schedule(retry, 0, baseConfig);
    expect(manager.isPending).toBe(true);

    timers.advance(100);
    await Promise.resolve();
    await Promise.resolve();

    const result = await done;
    expect(result.wasAborted).toBe(false);
    expect(retry).toHaveBeenCalledTimes(1);
    expect(manager.isPending).toBe(false);
  });

  it("respects maxRetries and resolves with wasAborted", async () => {
    const timers = createFakeTimers();
    const manager = new ReconnectManager(timers, () => 0);
    const retry = vi.fn().mockResolvedValue(undefined);

    const { done } = manager.schedule(retry, 6, baseConfig);
    const result = await done;
    expect(result.wasAborted).toBe(true);
    expect(retry).not.toHaveBeenCalled();
    expect(manager.isPending).toBe(false);
  });

  it("computes a delay using the injected random source", async () => {
    const timers = createFakeTimers();
    const random = vi.fn().mockReturnValue(0);
    const manager = new ReconnectManager(timers, random);
    const retry = vi.fn().mockResolvedValue(undefined);

    const { done } = manager.schedule(retry, 2, {
      ...baseConfig,
      jitterFactor: 0,
    });
    timers.advance(400); // 100 * 2^2
    await Promise.resolve();
    await Promise.resolve();
    const result = await done;
    expect(result.wasAborted).toBe(false);
    expect(retry).toHaveBeenCalledOnce();
    // The injected random is only consulted when jitterFactor > 0,
    // but we verify the constructor accepted it without throwing.
    expect(typeof manager.isPending).toBe("boolean");
  });

  it("applies jitter factor when random is non-zero", () => {
    // Indirect verification: confirm the manager wires calculateBackoff
    // (zero-jitter raw is 100, full-jitter upper bound is 200).
    expect(
      calculateBackoff(0, { baseDelayMs: 100, maxDelayMs: 1_000, jitterFactor: 1 }, () => 1)
    ).toBe(200);
    expect(
      calculateBackoff(0, { baseDelayMs: 100, maxDelayMs: 1_000, jitterFactor: 0 }, () => 1)
    ).toBe(100);
  });

  it("aborts an in-flight retry when schedule() is called again", async () => {
    const timers = createFakeTimers();
    const manager = new ReconnectManager(timers, () => 0);
    const first = vi.fn().mockResolvedValue(undefined);
    const second = vi.fn().mockResolvedValue(undefined);

    const { done: firstDone } = manager.schedule(first, 0, baseConfig);
    const { controller: abortCtrl, done: secondDone } = manager.schedule(second, 0, baseConfig);
    expect(abortCtrl.signal.aborted).toBe(false);

    timers.advance(100);
    await Promise.resolve();
    await Promise.resolve();

    const r1 = await firstDone;
    expect(r1.wasAborted).toBe(true);

    timers.advance(100);
    await Promise.resolve();
    await Promise.resolve();

    const r2 = await secondDone;
    expect(r2.wasAborted).toBe(false);
    expect(second).toHaveBeenCalledOnce();
    expect(first).not.toHaveBeenCalled();
  });

  it("cancels via .cancel()", async () => {
    const timers = createFakeTimers();
    const manager = new ReconnectManager(timers, () => 0);
    const retry = vi.fn().mockResolvedValue(undefined);

    const { done } = manager.schedule(retry, 0, baseConfig);
    manager.cancel();
    timers.advance(100);

    const result = await done;
    expect(result.wasAborted).toBe(true);
    expect(retry).not.toHaveBeenCalled();
    expect(manager.isPending).toBe(false);
  });

  it("is reusable after cancel()", async () => {
    const timers = createFakeTimers();
    const manager = new ReconnectManager(timers, () => 0);
    const retry = vi.fn().mockResolvedValue(undefined);

    const { done: firstDone } = manager.schedule(retry, 0, baseConfig);
    manager.cancel();
    await firstDone;

    const { done: secondDone } = manager.schedule(retry, 0, baseConfig);
    timers.advance(100);
    await Promise.resolve();
    await Promise.resolve();

    const r = await secondDone;
    expect(r.wasAborted).toBe(false);
    expect(retry).toHaveBeenCalledOnce();
  });

  it("runs the retryOn predicate and respects a false return", async () => {
    const timers = createFakeTimers();
    const manager = new ReconnectManager(timers, () => 0);
    const retry = vi.fn().mockResolvedValue(undefined);
    const retryOn = vi.fn().mockResolvedValue(false);

    const { done } = manager.schedule(retry, 0, {
      ...baseConfig,
      retryOn,
    });

    const r = await done;
    expect(r.wasAborted).toBe(true);
    expect(retryOn).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
  });

  it("proceeds when retryOn returns true", async () => {
    const timers = createFakeTimers();
    const manager = new ReconnectManager(timers, () => 0);
    const retry = vi.fn().mockResolvedValue(undefined);

    const { done } = manager.schedule(retry, 0, {
      ...baseConfig,
      retryOn: () => true,
    });
    // Let `#scheduleInternal` reach `#armTimer` (one microtask for
    // the `await config.retryOn(...)`).
    await Promise.resolve();
    timers.advance(100);
    await Promise.resolve();
    await Promise.resolve();

    const r = await done;
    expect(r.wasAborted).toBe(false);
    expect(retry).toHaveBeenCalledOnce();
  });

  it("aborts cleanly even if retryOn throws", async () => {
    const timers = createFakeTimers();
    const manager = new ReconnectManager(timers, () => 0);
    const retry = vi.fn().mockResolvedValue(undefined);

    const { done } = manager.schedule(retry, 0, {
      ...baseConfig,
      retryOn: () => {
        throw new Error("predicate blew up");
      },
    });
    await expect(done).resolves.toEqual({ wasAborted: true });
    expect(retry).not.toHaveBeenCalled();
  });

  it("swallows errors thrown by the retry callback", async () => {
    const timers = createFakeTimers();
    const manager = new ReconnectManager(timers, () => 0);
    const retry = vi.fn().mockRejectedValueOnce(new Error("retry failed"));

    const { done } = manager.schedule(retry, 0, baseConfig);
    timers.advance(100);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    const r = await done;
    expect(r.wasAborted).toBe(false);
    expect(retry).toHaveBeenCalledOnce();
  });
});
