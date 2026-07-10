/**
 * Public type contracts for `@ailuracode/alpine-ui`.
 *
 * The `ui` package is a framework-agnostic infrastructure layer used
 * primarily by Alpine Toolkit packages. It exposes only currently
 * exported primitives that multiple consumers would otherwise
 * re-implement in lock-step.
 *
 * The public surface is intentionally narrow: a generic
 * {@link StorageAdapter} contract plus factories that produce adapters
 * for the two most common backends (`localStorage` and in-memory).
 * Every feature package in the toolkit is expected to compose these
 * factories into its own typed adapter rather than re-deriving the
 * SSR-safe read / write / subscribe dance from scratch.
 */

/** Idempotent teardown function. Re-calling must not throw. */
export type Unsubscribe = () => void;

/**
 * Persistence adapter contract. Mirrors `ThemeStorage` from
 * `@ailuracode/alpine-theme` and `SidebarStorage` from
 * `@ailuracode/alpine-sidebar` with `Value` instead of a concrete
 * type — every feature package composes this contract into its own
 * typed shape via the factories in `./storage`.
 *
 * Parsing / validation happens inside the adapter so the consumer
 * (controller, manager, plugin) never deals with raw strings.
 */
export interface StorageAdapter<Value> {
  /** Reads the persisted value. Returns `null` when nothing / invalid value stored. */
  get(): Value | null;
  /** Persists `value`. No-op when the underlying API is unavailable. */
  set(value: Value): void;
  /** Removes the persisted value. */
  remove(): void;
  /**
   * Optional subscription hook. Implementations that can notify
   * observers of cross-instance changes (cross-tab via the
   * `storage` event, in-memory pub/sub) wire this up; backends
   * without an event channel leave it undefined.
   *
   * The listener receives `null` when the adapter's underlying store
   * is cleared (another tab called `removeItem`, the in-memory
   * adapter's `remove()` ran). Consumers treat `null` as
   * "fall back to the configured default".
   */
  subscribe?(listener: (next: Value | null) => void): Unsubscribe;
}

/**
 * Options accepted by {@link createLocalStorageAdapter}.
 *
 * The factory is value-polymorphic — the caller supplies the
 * `parse` / `serialize` pair that pins the persisted format. That
 * way theme, sidebar, and complex object-shaped consumers (query
 * devtools panel preferences) share the same SSR-safe plumbing
 * without leaking string parsing into their controllers.
 */
export interface LocalStorageAdapterOptions<Value> {
  /** `localStorage` key. Required. */
  readonly key: string;
  /**
   * Converts the raw stored string into the typed value. Return
   * `null` to reject the stored entry — the adapter forwards
   * `null` to the consumer so the controller can fall back to its
   * configured default instead of coercing garbage.
   */
  readonly parse: (raw: string) => Value | null;
  /** Converts the typed value into the stored string. */
  readonly serialize: (value: Value) => string;
  /**
   * Subscribe to cross-tab `storage` events. Default: `true`.
   * Consumers needing no cross-tab sync disable this to skip the
   * `window.addEventListener('storage', ...)` registration.
   */
  readonly crossTab?: boolean;
}

/** Options accepted by {@link createMemoryAdapter}. */
export interface MemoryAdapterOptions<Value> {
  /** Seed value. Default: `null` (storage starts empty). */
  readonly initial?: Value | null;
}

/**
 * Convenience alias for adapters that DO expose `subscribe`.
 * The in-memory factory always satisfies it; `localStorage`
 * satisfies it conditionally based on the `crossTab` option.
 */
export type SubscribableStorageAdapter<Value> = StorageAdapter<Value> & {
  subscribe: (listener: (next: Value | null) => void) => Unsubscribe;
};

/**
 * The `Unsubscribe` type is re-exported implicitly via the top of
 * this file (`export type Unsubscribe = ...`). No additional
 * re-export is needed here.
 */
