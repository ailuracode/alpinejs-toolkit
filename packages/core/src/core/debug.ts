/**
 * Diagnostic-event shim for `@ailuracode/alpine-core`.
 *
 * The full implementation lives in `@ailuracode/alpine-debug`, a
 * separate package that every consumer MAY install but is NOT
 * required to. This module provides the type-level bridge so
 * controllers in the toolkit can declare a `debug` option without
 * forcing a hard import on `@ailuracode/alpine-debug`.
 *
 * ## Why a shim and not a direct import
 *
 * The architectural rules in
 * [`.agents/instructions/architecture.instructions.md`](../../../.agents/instructions/architecture.instructions.md)
 * say core MUST NOT become a container of feature-specific helpers.
 * Diagnostic logging is exactly that kind of helper: useful, but
 * not part of the plugin / controller contract that core owns.
 *
 * Hoisting the contract into a separate package:
 *
 * - Lets production builds ship without `@ailuracode/alpine-debug`
 *   installed. The peer dep is **optional**; pnpm skips it cleanly.
 * - Keeps `core` focused on plugin registry, controllers, browser
 *   capability helpers, and Alpine event dispatching.
 * - Lets other packages (theme, media, future services) reuse the
 *   same primitive without redefining it.
 *
 * ## How the contract is satisfied
 *
 * This file re-declares the three types exposed by
 * `@ailuracode/alpine-debug`: `DebugEvent<TDetail>`,
 * `DebugLogger<TDetail>`, `DebugOption<TDetail>`. The shapes are
 * identical (TypeScript structural typing), so a logger built
 * against `@ailuracode/alpine-debug` is also a valid input here.
 *
 * The runtime helpers (`buildDebugEvent`, `safeDebugLog`,
 * `resolveDebugLogger`, `defaultDebugLogger`) live in
 * `@ailuracode/alpine-debug` and are NOT re-exported from core.
 * Controllers that need them import from `@ailuracode/alpine-debug`
 * directly — the shim is the type-only contract.
 *
 * ## Discovery pattern
 *
 * Core controllers that want to emit diagnostics should resolve
 * the logger through a dynamic import of `@ailuracode/alpine-debug`
 * the first time a transition fires. When the peer dep is missing
 * the import fails, the controller marks the sink unavailable,
 * and subsequent calls short-circuit to a no-op without retrying.
 * This keeps the registry, controllers, and lifecycle hooks
 * functional even when the debug package is not installed.
 */

/**
 * Augments a controller's transition detail with a monotonic
 * timestamp captured at emit time. Mirrors the type exposed by
 * `@ailuracode/alpine-debug` so a logger built against either
 * declaration is structurally compatible.
 */
export type DebugEvent<TDetail> = TDetail & {
  /** Monotonic timestamp (ms) captured at emit time. */
  readonly timestamp: number;
};

/**
 * Pluggable debug sink. Receives a structured event for every
 * transition the controller emits. MUST be synchronous; SHOULD NOT
 * throw (the caller wraps the call in `try/catch`).
 */
export type DebugLogger<TDetail> = (event: DebugEvent<TDetail>) => void;

/**
 * Public shape controllers accept for the `debug` option. `true`
 * selects the default logger; a function overrides the sink; `false`
 * and `undefined` turn debug off.
 */
export type DebugOption<TDetail> = boolean | DebugLogger<TDetail> | undefined;
