---
"@ailuracode/alpine-realtime": minor
---

Add `@ailuracode/alpine-realtime` (Phase 2: controller core).

- `RealtimeController` extends `BaseController<RealtimeEvents>` from `@ailuracode/alpine-core` and composes a private `EventTarget` for adapter message events.
- State machine: `disconnected` → `connecting` → `connected` ↔ `paused` ↔ `reconnecting` → `failed` / `disconnected`.
- Lifecycle methods (`connect`, `disconnect`, `pause`, `resume`, `destroy`) are all idempotent; the constructor has zero side effects.
- Channel API: `subscribe(channel, handler) → unsubscribe`, `publish(channel, message)`, FIFO delivery per channel with a per-controller `highWaterMark` and a `backpressure` event.
- Reconnect with exponential backoff + jitter, max retries, and a `MAX_RETRIES_EXCEEDED` event when retries are exhausted.
- Heartbeat: `sendHeartbeat` adapter call + `recordPong` on any inbound message, with a `HEARTBEAT_TIMEOUT` error after the watchdog elapses.
- Visibility: `pauseOnHidden` / `resumeOnVisible` driven by `VisibilityManager`; SSR-safe (`typeof document` guard).
- Adapter seam: `setAdapter(adapter)` for runtime swap, `getAdapter()` for inspection.
- New error taxonomy: `RealtimeError` with `TRANSPORT_ERROR`, `PARSE_ERROR`, `HEARTBEAT_TIMEOUT`, `MAX_RETRIES_EXCEEDED`, `CONFIG_ERROR`, `ADAPTER_ERROR`, `SEND_UNSUPPORTED` codes and `create*Error` factories.
- Config validation: `validateRealtimeControllerConfig` clamps `jitterFactor` to `[0, 1]`, `maxRetries` to `>= 0`, delays to `>= 1`, and applies documented defaults.
- Test helpers exported as `@ailuracode/alpine-realtime/test` (`createMockTransport`, `mockRealtimeControllerConfig`, `createFakeTimers`).
- 23 controller tests (state machine, idempotency, channel routing, backpressure, parser errors, transport errors, max retries, reconnect backoff, visibility, adapter swap, heartbeat timeout, publish, snapshot freezing, SSR-safe import).
