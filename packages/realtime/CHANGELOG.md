# @ailuracode/alpine-realtime

## 0.1.1

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 0.1.0

### Minor Changes

- ffb2e0e: Add `@ailuracode/alpine-realtime` (Phase 1: foundation).

  - Headless type contract: `RealtimeControllerConfig`, `RealtimeControllerState`, `RealtimeMessage`, `RealtimeError`, `RealtimeEvents`, `RealtimeTransportAdapter`, `TransportAdapterOptions`.
  - Pure utilities (SSR-safe, framework-agnostic, zero constructor side effects):
    - `calculateBackoff(attempt, config, random?)` — exponential backoff with multiplicative jitter; injectable RNG.
    - `ReconnectManager` — schedule retry attempts with `AbortController`, inject `setTimeout`/`clearTimeout` and `Math.random`.
    - `HeartbeatManager` — ping/pong state machine with RTT measurement, inject `setInterval`/`setTimeout`.
    - `VisibilityManager` — `visibilitychange` listener with injectable `document` (SSR-safe).
  - Defaults documented as JSDoc on every config field.
  - 100% coverage on the public surface (Vitest, fake timers).
  - `RealtimeController` and Alpine `$store.realtime` / `$realtime` wiring land in Phase 2.

- ffb2e0e: Add `@ailuracode/alpine-realtime` (Phase 2: controller core).

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

- ffb2e0e: Add `@ailuracode/alpine-realtime` (Phase 3: adapters + factory + Alpine plugin).

  - `SseTransportAdapter` — wraps the native `EventSource` (lazy in `connect()`); emits typed `open` / `message` / `error` / `close` events on its `EventTarget`; `send()` rejects with `RealtimeError(code: "SEND_UNSUPPORTED")`; `sendHeartbeat()` is a no-op (SSE heartbeats come from server-emitted comment lines). `EventSourceCtor` is injectable for deterministic tests. SSR-safe (`typeof EventSource` guard).
  - `WsTransportAdapter` — wraps the native `WebSocket` (lazy in `connect()`); emits typed `open` / `message` / `error` / `close` events; `send()` supports `string` / `ArrayBuffer` / `Blob`; `sendHeartbeat()` forwards the payload verbatim. `WebSocketCtor` is injectable. SSR-safe (`typeof WebSocket` guard).
  - `BaseEventTargetAdapter` — shared base class implementing `RealtimeTransportAdapter` and extending `EventTarget`. Owns the state machine (`idle` → `connecting` → `open` → `closing` → `closed` / `error`) and the typed-event dispatch helpers.
  - `TransportAdapterFactory` — `createSseTransport`, `createWsTransport`, `createAutoTransport` (probes WS, falls back to SSE within ~100 ms, returns the first adapter that opens), and `createBroadcastChannelTransport` (throws `RealtimeError(code: "ADAPTER_ERROR")`; v0.2.0 seam).
  - `realtimePlugin(defaultConfig?)` — Alpine plugin factory. Registers `$store.realtime` as a mirrored reactive store with a frozen `state` snapshot and an `isReady` getter, plus a `$realtime` magic exposing the full controller command surface (`connect`, `disconnect`, `pause`, `resume`, `destroy`, `subscribe`, `unsubscribe`, `publish`, `getState`, `on`, `off`). Adapter resolution is async and runs after Alpine registers the store/magic. Cleanup wires through `Alpine.cleanup` (when available) and calls `controller.destroy()` synchronously. Multiple controllers supported via `Alpine.store('realtime:<id>', controller)`.
  - New subpath exports: `./adapters`, `./alpine`. The main `./` entrypoint does not re-export from `./alpine/` (architecture-check constraint).
  - Controller `destroy()` now calls `super.destroy()` synchronously at the start so `isDestroyed` flips to `true` before async teardown completes (Alpine `cleanup` callbacks observe a deterministic "destroyed" phase).
  - Demo app wires `realtimePlugin()` into `alpine-boot.ts`; `apps/demo/tsconfig.json` and `astro.config.ts` add the realtime alias; `scripts/repo-check-policy.mjs` removes the temporary `realtime` exclusion from `demoExcluded`.
  - 52 new tests across the SSE adapter, WS adapter, factory, and plugin layers (constructor hygiene, lifecycle, message routing, error taxonomy, SSR-safe import, auto-fallback, multi-controller registration, store/magic sync).
  - Bundle: full surface 7.58 kB gzipped (budget 9 kB).

### Patch Changes

- 9a44380: `@ailuracode/alpine-realtime` `RealtimeControllerConfig` now accepts a `magicKey` so hosts with a pre-existing `$realtime` collision can move the integration surface without forking the controller or transport adapter. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "realtime"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `realtimePlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-realtime` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- Updated dependencies [3c8b40f]
- Updated dependencies [1ae869c]
- Updated dependencies [ade9bc7]
- Updated dependencies [556055a]
- Updated dependencies [a488cbb]
- Updated dependencies [aa88539]
- Updated dependencies [173379d]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1

## 0.0.0

Initial scaffold. Phase 1 (foundation) lands:

- Type contract: `RealtimeControllerConfig`, `RealtimeControllerState`, `RealtimeMessage`, `RealtimeError`, `RealtimeEvents`, `RealtimeTransportAdapter`, `TransportAdapterOptions`.
- Pure utilities: `calculateBackoff`, `ReconnectManager`, `HeartbeatManager`, `VisibilityManager`.
- SSR-safe constructor surface; injectable timers, RNG, and document for deterministic testing.

Phase 2 (controller core):

- `RealtimeController` extends `BaseController<RealtimeEvents>` from `@ailuracode/alpine-core`.
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

Phase 3 (adapters + factory + Alpine plugin):

- `SseTransportAdapter` — wraps the native `EventSource` (lazy in `connect()`); emits typed `open` / `message` / `error` / `close` events on its `EventTarget`; `send()` rejects with `RealtimeError(code: "SEND_UNSUPPORTED")`; `sendHeartbeat()` is a no-op (SSE heartbeats come from server-emitted comment lines). `EventSourceCtor` is injectable for deterministic tests. SSR-safe (`typeof EventSource` guard).
- `WsTransportAdapter` — wraps the native `WebSocket` (lazy in `connect()`); emits typed `open` / `message` / `error` / `close` events; `send()` supports `string` / `ArrayBuffer` / `Blob`; `sendHeartbeat()` forwards the payload verbatim. `WebSocketCtor` is injectable. SSR-safe (`typeof WebSocket` guard).
- `BaseEventTargetAdapter` — shared base class implementing `RealtimeTransportAdapter` and extending `EventTarget`. Owns the state machine (`idle` → `connecting` → `open` → `closing` → `closed` / `error`) and the typed-event dispatch helpers.
- `TransportAdapterFactory` — `createSseTransport`, `createWsTransport`, `createAutoTransport` (probes WS, falls back to SSE within ~100 ms, returns the first adapter that opens), and `createBroadcastChannelTransport` (throws `RealtimeError(code: "ADAPTER_ERROR")`; v0.2.0 seam).
- `realtimePlugin(defaultConfig?)` — Alpine plugin factory. Registers `$store.realtime` as a mirrored reactive store with a frozen `state` snapshot and an `isReady` getter, plus a `$realtime` magic exposing the full controller command surface (`connect`, `disconnect`, `pause`, `resume`, `destroy`, `subscribe`, `unsubscribe`, `publish`, `getState`, `on`, `off`). Adapter resolution is async and runs after Alpine registers the store/magic. Cleanup wires through `Alpine.cleanup` (when available) and calls `controller.destroy()` synchronously. Multiple controllers supported via `Alpine.store('realtime:<id>', controller)`.
- New subpath exports: `./adapters`, `./alpine`. The main `./` entrypoint does not re-export from `./alpine/` (architecture-check constraint).
- Controller `destroy()` now calls `super.destroy()` synchronously at the start so `isDestroyed` flips to `true` before async teardown completes (Alpine `cleanup` callbacks observe a deterministic "destroyed" phase).
- Demo app wires `realtimePlugin()` into `alpine-boot.ts`; `apps/demo/tsconfig.json` and `astro.config.ts` add the realtime alias; `scripts/repo-check-policy.mjs` removes the temporary `realtime` exclusion from `demoExcluded`.
- 52 new tests across the SSE adapter, WS adapter, factory, and plugin layers (constructor hygiene, lifecycle, message routing, error taxonomy, SSR-safe import, auto-fallback, multi-controller registration, store/magic sync).
- Bundle: full surface 7.58 kB gzipped (budget 9 kB).
