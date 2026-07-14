---
"@ailuracode/alpine-realtime": minor
---

Add `@ailuracode/alpine-realtime` (Phase 1: foundation).

- Headless type contract: `RealtimeControllerConfig`, `RealtimeControllerState`, `RealtimeMessage`, `RealtimeError`, `RealtimeEvents`, `RealtimeTransportAdapter`, `TransportAdapterOptions`.
- Pure utilities (SSR-safe, framework-agnostic, zero constructor side effects):
  - `calculateBackoff(attempt, config, random?)` — exponential backoff with multiplicative jitter; injectable RNG.
  - `ReconnectManager` — schedule retry attempts with `AbortController`, inject `setTimeout`/`clearTimeout` and `Math.random`.
  - `HeartbeatManager` — ping/pong state machine with RTT measurement, inject `setInterval`/`setTimeout`.
  - `VisibilityManager` — `visibilitychange` listener with injectable `document` (SSR-safe).
- Defaults documented as JSDoc on every config field.
- 100% coverage on the public surface (Vitest, fake timers).
- `RealtimeController` and Alpine `$store.realtime` / `$realtime` wiring land in Phase 2.