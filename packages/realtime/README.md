# @ailuracode/alpine-realtime

> **Status**: Phase 1 (foundation). The type contract and the four pure utilities (`calculateBackoff`, `ReconnectManager`, `HeartbeatManager`, `VisibilityManager`) are published; `RealtimeController` and the Alpine wiring land in subsequent phases.

Headless realtime transport controller for Alpine.js — Server-Sent Events, WebSocket, and pluggable transport adapters with automatic reconnect, exponential backoff, heartbeat, and visibility-aware pausing.

## Install

```bash
pnpm add @ailuracode/alpine-realtime @ailuracode/alpine-core alpinejs
```

## Quick start

```ts
import {
  calculateBackoff,
  HeartbeatManager,
  ReconnectManager,
  VisibilityManager,
} from "@ailuracode/alpine-realtime";

const reconnect = new ReconnectManager({
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
});

const { controller, done } = reconnect.schedule(
  () => fetchOnce(),
  0,
  { maxRetries: 5, baseDelayMs: 500, maxDelayMs: 8_000, jitterFactor: 0.5 }
);
done.then((result) => console.log("retry finished", result));
```

## Why

Long-lived realtime connections fail in interesting ways: networks drop silently, browser tabs go to sleep, servers restart, proxies idle-out connections. This package gives you a single controller that handles the messy parts — reconnect, backoff, heartbeat, visibility — while leaving transport selection, UI, and error messaging to your application.

## What ships in this phase

| Symbol | Kind | Purpose |
|--------|------|---------|
| `RealtimeControllerConfig` | type | Consumer-facing config (channel, retry policy, backoff base / cap / jitter, heartbeat interval / timeout, visibility policy). |
| `RealtimeControllerState` | type | Read-only snapshot for `$store.realtime.snapshot`. |
| `RealtimeMessage` / `RealtimeMessageInit` | type | Envelope adapters exchange with the controller. |
| `RealtimeError` | class | Stable error codes via `ToolkitError`. |
| `RealtimeEvents` | type | Discriminated event map (`realtime:open`, `realtime:message`, `realtime:close`, `realtime:error`, `realtime:state`, `realtime:reconnect`, `realtime:giveup`). |
| `RealtimeTransportAdapter` | type | Adapter contract for SSE / WS / memory implementations. |
| `calculateBackoff` | fn | Pure exponential-backoff with multiplicative jitter; inject your own RNG for tests. |
| `ReconnectManager` | class | Schedule retry attempts with abort / cancel; inject `setTimeout` + `clearTimeout`. |
| `HeartbeatManager` | class | Drive ping/pong state machine with RTT measurement; injectable timers. |
| `VisibilityManager` | class | SSR-safe `visibilitychange` listener with injectable `document`. |

Later phases add:

- `RealtimeController` extending `BaseController`.
- SSE and WebSocket adapters wired to the runtime transports.
- Alpine `$store.realtime` + `$realtime` magic.

## Architecture

The package follows the toolkit's HEADLESS PATTERN:

- **No Alpine dependency in core/utils.** Utilities are framework-agnostic and SSR-safe.
- **Zero constructor side effects.** Classes only store config; `start()` and `schedule()` perform work.
- **Pure functions where possible.** `calculateBackoff` is a single expression with injectable `Math.random`.
- **Injectable timers / RNG / document.** All four managers accept factory hooks so tests can drive deterministic timelines.

`pnpm run architecture:check` enforces that controller modules never import `alpinejs` at runtime, and that constructors never touch browser globals.

### Avoiding name collisions

If your application already owns a `$store.realtime` / `$realtime` — or another toolkit plugin registers on those names — rename the integration surface without touching the controller or transport adapter:

```ts
Alpine.plugin(
  realtimePlugin({ id: "live", magicKey: "live" })
); // → $store.live / $live
```

The store key is derived from `id`; the magic key uses `magicKey`. Both fall back to `"realtime"` when unset.

## Tests

```bash
pnpm --filter @ailuracode/alpine-realtime test
```

All four utility modules ship with Vitest coverage targeting 100% of the public surface.

## License

MIT
