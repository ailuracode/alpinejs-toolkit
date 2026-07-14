import realtimePlugin from "@ailuracode/alpine-realtime";
import Alpine from "alpinejs";

/**
 * In-memory mock adapter for the E2E fixture.
 *
 * Implements the `RealtimeTransportAdapter` contract shape — an
 * `EventTarget`-compatible object that emits `open` on successful
 * connect. The mock does NOT emit `close` on graceful disconnect
 * because the controller's `#onAdapterClose` handler treats every
 * close as a transport failure (no wasClean differentiation), which
 * would trigger auto-reconnect and prevent `pause()` from reaching
 * the `paused` state — see `RealtimeController#onAdapterClose` /
 * `#handleTransportFailure`.
 */
function createMockAdapter() {
  const target = new EventTarget();
  let readyState: "idle" | "connecting" | "open" | "closing" | "closed" | "error" = "idle";
  let destroyed = false;

  return {
    transportType: "sse" as const,
    endpoint: "mock://localhost",
    get readyState() {
      return readyState;
    },
    isSupported(): boolean {
      return !destroyed;
    },
    async connect(): Promise<void> {
      if (destroyed) {
        throw new Error("MockAdapter: connect() after destroy()");
      }
      readyState = "connecting";
      // Defer the open event one microtask so callers can `await
      // connect()` and then observe the transition.
      await Promise.resolve();
      readyState = "open";
      target.dispatchEvent(new Event("open"));
    },
    async send(): Promise<void> {
      // SSE has no client-to-server frames — no-op for the mock.
    },
    async sendHeartbeat(): Promise<void> {
      // No-op — the fixture disables heartbeats via config below.
    },
    async disconnect(): Promise<void> {
      if (readyState === "idle" || readyState === "closed") {
        return;
      }
      readyState = "closing";
      await Promise.resolve();
      readyState = "closed";
      // Intentionally NOT dispatching a `close` event here — see
      // the header comment. Use a separate `simulateFailure()`
      // helper if a future test needs to drive the auto-reconnect
      // path.
    },
    /** Test hook — emit a `close` event as if the transport dropped. */
    simulateFailure(): void {
      readyState = "closed";
      target.dispatchEvent(new Event("close"));
    },
    destroy(): void {
      destroyed = true;
      readyState = "closed";
    },
    // Forward the EventTarget surface so the controller can wire
    // its listeners through `addEventListener`.
    addEventListener: (...args: Parameters<typeof target.addEventListener>): void => {
      target.addEventListener(...args);
    },
    removeEventListener: (...args: Parameters<typeof target.removeEventListener>): void => {
      target.removeEventListener(...args);
    },
    dispatchEvent: (...args: Parameters<typeof target.dispatchEvent>): boolean =>
      target.dispatchEvent(...args),
  };
}

Alpine.plugin(
  realtimePlugin({
    adapter: createMockAdapter() as never,
    // Top-level config fields — `RealtimeControllerConfig` is flat
    // (no nested `heartbeat` / `reconnect` bags). `heartbeatIntervalMs: 0`
    // disables outbound pings so the fixture never fires timer work.
    heartbeatIntervalMs: 0,
    maxRetries: 3,
  })
);
Alpine.start();
