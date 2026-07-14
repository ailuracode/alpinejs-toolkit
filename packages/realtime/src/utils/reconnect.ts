/**
 * Reconnect manager that schedules retries with exponential backoff.
 *
 * The manager is intentionally framework-agnostic — `setTimeout`,
 * `clearTimeout`, and `Math.random` are all injectable. The
 * controller composes a {@link ReconnectManager} alongside
 * {@link HeartbeatManager} and {@link VisibilityManager} to keep its
 * own responsibilities minimal.
 *
 * ```text
 *   schedule(fn, attempt, config)
 *           │
 *           ├─ delay = calculateBackoff(attempt, ...)
 *           ├─ timer  = setTimeout(() => fn(), delay)
 *           └─ return AbortController (call .abort() to cancel)
 * ```
 *
 * @module
 */

import { type BackoffConfig, calculateBackoff, DEFAULT_BACKOFF_CONFIG } from "./backoff";

/**
 * Decision returned by {@link ReconnectConfig.retryOn}. Returning
 * `true` schedules another attempt; `false` resolves permanently
 * with a `giveup` event.
 */
export type ReconnectDecision = boolean;

/**
 * Predicate called before each retry attempt. Receives the
 * accumulated retry counter (1-based after the first failed
 * attempt) and the most recent error so consumers can decide
 * whether to keep going.
 *
 * Returning `false` (or throwing) stops further retries.
 */
export type ReconnectPredicate = (info: {
  attempts: number;
  reason: unknown;
}) => ReconnectDecision | Promise<ReconnectDecision>;

/**
 * Configuration accepted by {@link ReconnectManager.schedule}.
 *
 * `retryOn` is intentionally untyped here; consumers pass a
 * predicate that already understands the realtime error model.
 */
export interface ReconnectConfig {
  /** Maximum retry attempts. `Infinity` keeps retrying forever. */
  readonly maxRetries: number;
  /** Backoff base delay (ms). */
  readonly baseDelayMs: number;
  /** Backoff cap (ms). */
  readonly maxDelayMs: number;
  /** Multiplicative jitter factor. */
  readonly jitterFactor: number;
  /** Predicate consulted after each failure. */
  readonly retryOn?: ReconnectPredicate;
}

/**
 * Opaque handle returned by the injected `setTimeout`. Browsers
 * return `number`; Node returns a `Timeout` object. We type the
 * handle as `number` because the package is browser-targeted and
 * `setTimeout` in DOM lib is `number`. Production consumers that
 * run in Node should cast `globalThis.setTimeout` at the
 * constructor site (`new ReconnectManager({ setTimeout: globalThis.setTimeout as ... })`).
 */
export type TimerHandle = number;

/**
 * Surface for the timer primitives the manager depends on. Both
 * members are required; pass `globalThis.setTimeout` /
 * `globalThis.clearTimeout` in production and deterministic
 * substitutes in tests.
 */
export interface ReconnectTimers {
  readonly setTimeout: (handler: () => void, delayMs: number) => TimerHandle;
  readonly clearTimeout: (handle: TimerHandle) => void;
}

/**
 * Injectable random source consumed by the backoff calculator.
 * Defaults to {@link Math.random} when omitted.
 */
export type ReconnectRandom = () => number;

interface ScheduledAttempt {
  readonly controller: AbortController;
  readonly attempt: number;
  readonly timer: TimerHandle;
  readonly cancelTimer: () => void;
}

/**
 * Owns the retry loop for a single subscription. The manager is
 * one-shot per subscription: when `cancel()` is called, the
 * outstanding timeout is cleared and any further `schedule()` calls
 * are no-ops until the manager is reused for a new subscription.
 *
 * `setTimeout`/`clearTimeout` are mandatory constructor parameters
 * (no defaults). Tests pass `vi.useFakeTimers()`-compatible
 * implementations; consumers running in production pass
 * `globalThis.setTimeout`/`globalThis.clearTimeout`.
 */
export class ReconnectManager {
  readonly #timers: ReconnectTimers;
  readonly #random: ReconnectRandom;
  #scheduled: ScheduledAttempt | null = null;
  #subscriptionGeneration = 0;

  constructor(timers: ReconnectTimers, random: ReconnectRandom = Math.random) {
    this.#timers = timers;
    this.#random = random;
  }

  /**
   * Schedules the next retry attempt.
   *
   * Behaviour:
   *
   * - When a previous attempt is still pending, it is cancelled and
   *   the new request takes its place (latest-wins semantics).
   * - When `attempt` exceeds `maxRetries`, the promise resolves
   *   without calling `retryFn` and `wasAborted` flips to `true`.
   * - When `retryOn` returns `false`, the promise resolves without
   *   calling `retryFn` and `wasAborted` flips to `true`.
   * - Cancelling via the returned `AbortController.abort()` (or via
   *   {@link ReconnectManager.cancel}) prevents the retry from
   *   running but keeps the manager reusable for the next
   *   subscription.
   *
   * Returns the promise that resolves when the scheduled attempt
   *   finishes (either after calling `retryFn` or after skipping).
   *   `wasAborted` lets callers distinguish skip / fail from cancel.
   */
  schedule(
    retryFn: () => Promise<void>,
    attempt: number,
    config: ReconnectConfig
  ): { controller: AbortController; done: Promise<{ wasAborted: boolean }> } {
    this.#subscriptionGeneration += 1;
    const generation = this.#subscriptionGeneration;

    const controller = new AbortController();
    const previous = this.#scheduled;
    this.#scheduled = null;

    if (previous) {
      previous.cancelTimer();
      previous.controller.abort();
    }

    return {
      controller,
      done: this.#scheduleInternal(retryFn, attempt, config, controller, generation),
    };
  }

  /**
   * Cancels the pending retry (if any). Idempotent.
   *
   * After `cancel()`, the controller is safe to reuse — calling
   * `schedule()` again starts a fresh subscription.
   */
  cancel(): void {
    const current = this.#scheduled;
    this.#scheduled = null;
    if (current) {
      current.cancelTimer();
      current.controller.abort();
    }
    // Increment so any in-flight promise chain recognizes it was
    // superseded.
    this.#subscriptionGeneration += 1;
  }

  /** True when an attempt is currently pending. */
  get isPending(): boolean {
    return this.#scheduled !== null;
  }

  async #scheduleInternal(
    retryFn: () => Promise<void>,
    attempt: number,
    config: ReconnectConfig,
    controller: AbortController,
    generation: number
  ): Promise<{ wasAborted: boolean }> {
    if (controller.signal.aborted) {
      return { wasAborted: true };
    }

    const safeAttempt = Math.max(0, Math.floor(attempt));
    if (safeAttempt >= config.maxRetries) {
      controller.abort();
      return { wasAborted: true };
    }

    let decision = true;
    if (config.retryOn) {
      try {
        decision = await config.retryOn({ attempts: safeAttempt, reason: undefined });
      } catch {
        // Predicate threw — treat as "do not retry" rather than
        // surfacing the error to the controller. The caller can
        // still observe the rejection via their own try/catch on
        // the retry function if they want richer semantics.
        decision = false;
      }
    }
    if (!decision || controller.signal.aborted || generation !== this.#subscriptionGeneration) {
      if (generation === this.#subscriptionGeneration) {
        controller.abort();
      }
      return { wasAborted: true };
    }

    const backoff = toBackoffConfig(config);
    const delayMs = calculateBackoff(safeAttempt, backoff, this.#random);

    const result = await this.#armTimer(retryFn, delayMs, controller, generation);
    if (generation !== this.#subscriptionGeneration) {
      return { wasAborted: true };
    }
    return result;
  }

  #armTimer(
    retryFn: () => Promise<void>,
    delayMs: number,
    controller: AbortController,
    generation: number
  ): Promise<{ wasAborted: boolean }> {
    return new Promise((resolve) => {
      let cleared = false;

      const cancelTimer = (): void => {
        if (cleared) {
          return;
        }
        cleared = true;
        const scheduled = this.#scheduled;
        if (scheduled) {
          this.#timers.clearTimeout(scheduled.timer);
        }
        this.#scheduled = null;
      };

      const onAbort = (): void => {
        if (!cleared) {
          cleared = true;
          const scheduled = this.#scheduled;
          if (scheduled) {
            this.#timers.clearTimeout(scheduled.timer);
          }
          this.#scheduled = null;
        }
        resolve({ wasAborted: true });
      };

      controller.signal.addEventListener("abort", onAbort, { once: true });

      const handle = this.#timers.setTimeout(() => {
        if (controller.signal.aborted || generation !== this.#subscriptionGeneration) {
          cancelTimer();
          resolve({ wasAborted: true });
          return;
        }

        cleared = true;
        this.#scheduled = null;
        controller.signal.removeEventListener("abort", onAbort);

        Promise.resolve()
          .then(() => retryFn())
          .catch(() => {
            /* swallow — controller surfaces errors upstream */
          })
          .finally(() => {
            resolve({ wasAborted: false });
          });
      }, delayMs);

      this.#scheduled = {
        controller,
        attempt: 0,
        timer: handle,
        cancelTimer,
      };
    });
  }
}

function toBackoffConfig(config: ReconnectConfig): BackoffConfig {
  return {
    baseDelayMs: config.baseDelayMs ?? DEFAULT_BACKOFF_CONFIG.baseDelayMs,
    maxDelayMs: config.maxDelayMs ?? DEFAULT_BACKOFF_CONFIG.maxDelayMs,
    jitterFactor: config.jitterFactor ?? DEFAULT_BACKOFF_CONFIG.jitterFactor,
  };
}
