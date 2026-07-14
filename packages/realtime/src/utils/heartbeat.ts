/**
 * Heartbeat manager.
 *
 * Responsible for keeping a long-lived transport alive and detecting
 * half-open connections. Two timer primitives cooperate:
 *
 * - An `intervalTimer` fires every `intervalMs` and invokes the
 *   user-supplied `sendHeartbeat` callback.
 * - A `timeoutTimer` arms after each ping and fires `onTimeout` if
 *   the controller never calls {@link HeartbeatManager.recordPong}
 *   within `timeoutMs`.
 *
 * All four timer primitives (`setInterval`/`clearInterval` and
 * `setTimeout`/`clearTimeout`) are injectable so tests can drive the
 * state machine with fake timers and deterministic RNG.
 *
 * @module
 */

/**
 * Surface for both interval and timeout primitives. Consumers MUST
 * pass `globalThis.setInterval`/`globalThis.clearInterval` and
 * `globalThis.setTimeout`/`globalThis.clearTimeout` in production.
 *
 * Handle types are aliased to a numeric opaque type so the package
 * is portable across browser (`number`) and Node (`Timeout`)
 * environments without forcing consumers to cast at the call site.
 */
export interface HeartbeatTimers {
  readonly setInterval: (handler: () => void, intervalMs: number) => number;
  readonly clearInterval: (handle: number) => void;
  readonly setTimeout: (handler: () => void, delayMs: number) => number;
  readonly clearTimeout: (handle: number) => void;
}

/**
 * Result of {@link HeartbeatManager.start} / {@link HeartbeatManager.recordPong}.
 *
 * `lastPingAt` is the timestamp of the most recent outbound ping
 * (ms since epoch); useful for dashboards and debug tooling.
 *
 * `lastPongAt` is the timestamp of the most recent inbound pong
 * acknowledgement. When the controller receives its first message
 * from the transport, it should call {@link HeartbeatManager.recordPong}
 * to advance this clock.
 */
export interface HeartbeatStats {
  readonly lastPingAt: number | null;
  readonly lastPongAt: number | null;
  /** Most recent measured round-trip (ms), `null` if no pong yet. */
  readonly lastRttMs: number | null;
}

/**
 * Heartbeat state machine. Independent of the controller and the
 * transport — drives `sendHeartbeat` periodically and reports a
 * timeout when a pong is not received within `timeoutMs` of a ping.
 *
 * Lifecycle:
 *
 * ```text
 *   ┌────────┐  start() ┌─────────┐  stop() / timeout ┌─────────┐
 *   │ idle   │ ────────▶│ running │ ──────────────────▶│ stopped │
 *   └────────┘          └─────────┘                    └─────────┘
 *                            │
 *                            └ ping fired ─▶ pong received ─▶ reschedule
 * ```
 */
export class HeartbeatManager {
  readonly #timers: HeartbeatTimers;
  #intervalHandle: number | null = null;
  #timeoutHandle: number | null = null;
  #listeners: {
    sendHeartbeat: () => Promise<void>;
    onTimeout: () => void;
  } | null = null;
  #timeoutMs = 0;
  #lastPingAt: number | null = null;
  #lastPongAt: number | null = null;
  #lastRttMs: number | null = null;
  #now: () => number = () => Date.now();
  #running = false;

  constructor(timers: HeartbeatTimers) {
    this.#timers = timers;
  }

  /**
   * Begins heartbeat scheduling. Idempotent — calling `start` while
   * already running is a no-op.
   *
   * - `intervalMs === 0` disables the interval entirely (useful when
   *   the transport is request/response only).
   * - `timeoutMs === 0` disables the timeout watchdog; the manager
   *   fires pings but never reports timeouts.
   */
  start(
    sendHeartbeat: () => Promise<void>,
    onTimeout: () => void,
    intervalMs: number,
    timeoutMs: number
  ): void {
    if (this.#running) {
      return;
    }

    if (!Number.isFinite(intervalMs) || intervalMs < 0) {
      throw new RangeError("intervalMs must be a non-negative finite number");
    }
    if (!Number.isFinite(timeoutMs) || timeoutMs < 0) {
      throw new RangeError("timeoutMs must be a non-negative finite number");
    }

    this.#listeners = { sendHeartbeat, onTimeout };
    this.#timeoutMs = timeoutMs;
    this.#lastPingAt = null;
    this.#lastPongAt = null;
    this.#lastRttMs = null;
    this.#running = true;

    if (intervalMs > 0) {
      this.#intervalHandle = this.#timers.setInterval(() => {
        this.#firePing();
      }, intervalMs);
    }
  }

  /**
   * Stops all timers and clears internal state. Idempotent.
   */
  stop(): void {
    if (this.#intervalHandle !== null) {
      this.#timers.clearInterval(this.#intervalHandle);
      this.#intervalHandle = null;
    }
    if (this.#timeoutHandle !== null) {
      this.#timers.clearTimeout(this.#timeoutHandle);
      this.#timeoutHandle = null;
    }
    this.#listeners = null;
    this.#running = false;
  }

  /**
   * Records that a pong (or any inbound message) was received. Resets
   * the timeout watchdog and updates RTT stats.
   */
  recordPong(): void {
    if (!this.#running) {
      return;
    }

    const now = this.#now();
    this.#lastPongAt = now;
    if (this.#lastPingAt !== null) {
      this.#lastRttMs = Math.max(0, now - this.#lastPingAt);
    }
    this.#clearTimeout();
  }

  /** True between `start()` and `stop()`. */
  get isRunning(): boolean {
    return this.#running;
  }

  /** Read-only stats for the most recent ping/pong window. */
  get stats(): HeartbeatStats {
    return {
      lastPingAt: this.#lastPingAt,
      lastPongAt: this.#lastPongAt,
      lastRttMs: this.#lastRttMs,
    };
  }

  /** Replaces the time source used for round-trip measurements (test hook). */
  setNow(now: () => number): void {
    this.#now = now;
  }

  #firePing(): void {
    if (!(this.#running && this.#listeners)) {
      return;
    }

    const pingAt = this.#now();
    this.#lastPingAt = pingAt;

    const { sendHeartbeat, onTimeout } = this.#listeners;

    void Promise.resolve()
      .then(() => sendHeartbeat())
      .catch(() => {
        /* swallow — controller surfaces errors upstream */
      });

    if (this.#timeoutMs > 0) {
      this.#clearTimeout();
      this.#timeoutHandle = this.#timers.setTimeout(() => {
        this.#timeoutHandle = null;
        if (this.#running && this.#listeners) {
          this.#listeners.onTimeout = () => onTimeout();
          // Re-read in case stop() ran during ping resolution.
          if (this.#running) {
            onTimeout();
          }
        }
      }, this.#timeoutMs);
    }
  }

  #clearTimeout(): void {
    if (this.#timeoutHandle !== null) {
      this.#timers.clearTimeout(this.#timeoutHandle);
      this.#timeoutHandle = null;
    }
  }
}
