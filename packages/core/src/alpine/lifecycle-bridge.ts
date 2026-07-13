/**
 * Shared Alpine lifecycle helpers for controller-backed feature adapters.
 *
 * These utilities centralize the invariant wiring every store plugin repeats:
 * reactive proxy re-targeting, stable magic accessors, subscription teardown,
 * and idempotent `Alpine.cleanup` forwarding. Package-specific store sync
 * stays in the adapter via the `sync` callback.
 */

import type { Unsubscribe } from "../core/event.js";

/** Minimal Alpine surface required for cleanup registration. */
export interface AlpineCleanupHost {
  cleanup?: (callback: () => void) => void;
}

/** Minimal Alpine surface required for store + magic registration. */
export interface AlpineStoreHost<TStore extends object> {
  store(name: string, value: TStore): void;
  store(name: string): TStore;
  magic?(name: string, factory: () => unknown): void;
}

/** Controller surface consumed by {@link bindControllerStore}. */
export interface ControllerChangeEmitter<TDetail> {
  on(event: "change", listener: (detail: TDetail) => void): Unsubscribe;
  destroy(): void;
}

/**
 * Registers one or more teardown callbacks with Alpine's cleanup hook.
 *
 * Teardowns run in registration order. When `Alpine.cleanup` is unavailable
 * (older Alpine versions), this is a no-op.
 */
export function registerAlpineCleanup(
  alpine: AlpineCleanupHost,
  ...teardowns: ReadonlyArray<() => void>
): void {
  if (typeof alpine.cleanup !== "function") {
    return;
  }

  alpine.cleanup(() => {
    for (const teardown of teardowns) {
      teardown();
    }
  });
}

/**
 * Mirrors a string-keyed snapshot onto a mutable record for Alpine reactivity.
 *
 * Keys present in `snapshot` are copied onto `target`. Keys that exist on
 * `target` but not in `snapshot` are removed so stale instances do not linger.
 */
export function syncRecordFromSnapshot<T extends Record<string, unknown>>(
  target: Record<string, unknown>,
  snapshot: T
): void {
  for (const key of Object.keys(snapshot)) {
    target[key] = snapshot[key];
  }

  for (const key of Object.keys(target)) {
    if (!(key in snapshot)) {
      Reflect.deleteProperty(target, key);
    }
  }
}

export interface BindControllerStoreOptions<TStore extends object, TDetail> {
  /** Alpine runtime narrowed to the feature's typed view. */
  alpine: AlpineStoreHost<TStore> & AlpineCleanupHost;
  /** Store key registered on `$store` and used for the default magic name. */
  storeKey: string;
  /** Plain-object store seeded from the controller before proxy registration. */
  store: TStore;
  /** Headless controller that emits `change` and owns `destroy()`. */
  controller: ControllerChangeEmitter<TDetail>;
  /**
   * Copies controller state onto the reactive proxy. Keep this package-specific
   * so field-level sync stays readable in the adapter.
   */
  sync: (reactiveStore: TStore, detail: TDetail) => void;
  /**
   * Custom subscription wiring. When omitted, the bridge subscribes to
   * `controller.on("change", sync)`. Return a single unsubscribe or call every
   * returned unsubscribe during teardown.
   */
  subscribe?: (notify: (detail: TDetail) => void) => Unsubscribe;
  /**
   * Optional magic registration. Defaults to `$<storeKey>` returning the cached
   * reactive proxy. Pass `false` when the magic surface is custom (e.g. toast).
   */
  magic?:
    | {
        name: string;
        factory: (reactiveStore: TStore) => unknown;
      }
    | false;
  /**
   * Extra teardown steps that run before subscription unsubscribe and controller
   * destruction. Use for DOM listeners or other adapter-owned resources.
   */
  beforeDestroy?: ReadonlyArray<() => void>;
  /**
   * Hook invoked after the reactive proxy is resolved. Use for one-off store
   * mutations that must target the proxy (e.g. patching helper methods).
   */
  onReactiveStore?: (reactiveStore: TStore) => void;
}

export interface BoundControllerStore<TStore extends object> {
  /** Alpine's reactive proxy for the registered store. */
  reactiveStore: TStore;
  /** Unsubscribes the controller `change` listener installed by the bridge. */
  unsubscribe: Unsubscribe;
}

/**
 * Wires a headless controller into Alpine's store + magic lifecycle.
 *
 * Cleanup order (documented invariant):
 *
 * 1. `beforeDestroy` callbacks (adapter-owned resources)
 * 2. controller `change` subscription unsubscribe
 * 3. `controller.destroy()` (releases singleton slots when applicable)
 *
 * The returned `unsubscribe` is owned by the bridge cleanup hook. Callers should
 * not invoke it manually unless they skip {@link registerAlpineCleanup}.
 */
export function bindControllerStore<TStore extends object, TDetail>(
  options: BindControllerStoreOptions<TStore, TDetail>
): BoundControllerStore<TStore> {
  const {
    alpine,
    storeKey,
    store,
    controller,
    sync,
    subscribe,
    magic,
    beforeDestroy,
    onReactiveStore,
  } = options;

  alpine.store(storeKey, store);
  const reactiveStore = alpine.store(storeKey);

  onReactiveStore?.(reactiveStore);

  const unsubscribe = subscribe
    ? subscribe((detail) => {
        sync(reactiveStore, detail);
      })
    : controller.on("change", (detail) => {
        sync(reactiveStore, detail);
      });

  if (magic === false) {
    // Custom magic wiring stays in the adapter.
  } else if (magic) {
    alpine.magic?.(magic.name, () => magic.factory(reactiveStore));
  } else {
    alpine.magic?.(storeKey, () => reactiveStore);
  }

  const teardowns: Array<() => void> = [];
  if (beforeDestroy) {
    for (const step of beforeDestroy) {
      teardowns.push(step);
    }
  }
  teardowns.push(unsubscribe, () => {
    controller.destroy();
  });

  registerAlpineCleanup(alpine, ...teardowns);

  return { reactiveStore, unsubscribe };
}
