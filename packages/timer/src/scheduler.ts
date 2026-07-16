/**
 * Drift-resistant scheduler for timer synchronization.
 *
 * The scheduler only triggers reactive synchronization — elapsed time
 * is always derived from monotonic timestamps.
 */

export interface MonotonicClock {
  now(): number;
}

export interface Scheduler {
  schedule(callback: () => void, intervalMs: number): () => void;
}

export function createMonotonicClock(): MonotonicClock {
  return {
    now(): number {
      if (typeof performance !== "undefined" && typeof performance.now === "function") {
        return performance.now();
      }
      return Date.now();
    },
  };
}

export function createIntervalScheduler(): Scheduler {
  return {
    schedule(callback, intervalMs) {
      const handle = setInterval(callback, intervalMs);
      return () => {
        clearInterval(handle);
      };
    },
  };
}
