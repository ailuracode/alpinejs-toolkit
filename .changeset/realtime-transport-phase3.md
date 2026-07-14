---
"@ailuracode/alpine-realtime": minor
---

Add `@ailuracode/alpine-realtime` (Phase 3: adapters + factory + Alpine plugin).

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