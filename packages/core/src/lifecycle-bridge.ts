/**
 * Shared lifecycle bridge for controller-backed Alpine adapters.
 *
 * Feature packages repeat the same integration sequence:
 *
 * 1. register a store and retrieve Alpine's reactive proxy;
 * 2. subscribe to controller changes and mirror fields on the proxy;
 * 3. register a magic accessor that returns the cached proxy;
 * 4. forward cleanup to subscription teardown and controller destruction.
 *
 * Store synchronization stays in each package — these helpers only
 * centralize the invariant wiring and document cleanup order.
 */

import type { Unsubscribe } from "./core/event";
import type { Alpine } from "./core/type";

/** Controller with an idempotent `destroy()` — every bridged adapter owns one. */
export interface Destroyable {
  destroy(): void;
}

/**
 * Alpine runtime surface required by the lifecycle bridge.
 * `cleanup` is optional because older Alpine versions omit it.
 */
export interface AlpineLifecycleHost extends Alpine {
  cleanup?: (callback: () => void) => void;
}

/** Result of {@link registerReactiveStore}. */
export interface ReactiveStoreRegistration<TStore> {
  readonly reactiveStore: TStore;
}

/**
 * Registers `store` under `storeKey` and returns Alpine's reactive proxy.
 *
 * Mutations MUST target the returned proxy — not the original `store`
 * object — so Alpine's reactivity tracks assignments.
 */
export function registerReactiveStore<TStore>(
  alpine: Alpine,
  storeKey: string,
  store: TStore
): ReactiveStoreRegistration<TStore> {
  alpine.store(storeKey, store);
  const reactiveStore = alpine.store(storeKey) as TStore;
  return { reactiveStore };
}

/**
 * Registers a magic accessor backed by a stable reference.
 *
 * Pass a factory that closes over the reactive store proxy so every
 * `$name` access returns the same object.
 */
export function registerStoreMagic<T>(alpine: Alpine, magicKey: string, accessor: () => T): void {
  alpine.magic(magicKey, accessor);
}

/** Options for {@link wireControllerLifecycle}. */
export interface WireControllerLifecycleOptions {
  /** Controller event-bus unsubscribes — torn down first (LIFO). */
  subscriptions?: readonly Unsubscribe[];
  /** Extra adapter cleanups such as DOM listeners — torn down second (LIFO). */
  onCleanup?: readonly (() => void)[];
}

/**
 * Forwards adapter teardown through `Alpine.cleanup` when available.
 *
 * Cleanup order:
 *
 * 1. `subscriptions` — detach controller listeners (LIFO)
 * 2. `onCleanup` — adapter-specific teardown such as DOM listeners (LIFO)
 * 3. `controller.destroy()` — release the controller / singleton slot
 *
 * Each step is idempotent. When `Alpine.cleanup` is missing the bridge
 * is a no-op — callers on legacy Alpine versions must destroy manually.
 */
export function wireControllerLifecycle(
  alpine: AlpineLifecycleHost,
  controller: Destroyable,
  options: WireControllerLifecycleOptions = {}
): void {
  if (typeof alpine.cleanup !== "function") {
    return;
  }

  alpine.cleanup(() => {
    const { subscriptions = [], onCleanup = [] } = options;

    for (let index = subscriptions.length - 1; index >= 0; index -= 1) {
      subscriptions[index]();
    }

    for (let index = onCleanup.length - 1; index >= 0; index -= 1) {
      onCleanup[index]();
    }

    controller.destroy();
  });
}

/** Options for {@link bridgeControllerStore}. */
export interface ControllerStoreBridgeOptions<TStore, TController extends Destroyable> {
  alpine: Alpine;
  storeKey: string;
  store: TStore;
  controller: TController;
  /** Defaults to `storeKey`. Use when the magic name differs (e.g. toast). */
  magicKey?: string;
  /** Defaults to `() => reactiveStore`. Use for composite magics. */
  magicAccessor?: () => unknown;
  /**
   * Package-specific synchronization. MUST return the controller
   * subscription unsubscribe so cleanup can detach the listener.
   */
  subscribe?: (reactiveStore: TStore) => Unsubscribe;
  /** Extra adapter teardown such as DOM listeners. */
  onCleanup?: () => void;
}

/** Result of {@link bridgeControllerStore}. */
export interface ControllerStoreBridge<TStore> {
  readonly reactiveStore: TStore;
}

/**
 * Wires the invariant controller-backed adapter sequence.
 *
 * Store field mirroring stays in `subscribe` so each package keeps
 * readable, domain-specific synchronization logic.
 */
export function bridgeControllerStore<TStore, TController extends Destroyable>(
  options: ControllerStoreBridgeOptions<TStore, TController>
): ControllerStoreBridge<TStore> {
  const {
    alpine,
    storeKey,
    store,
    controller,
    magicKey = storeKey,
    magicAccessor,
    subscribe,
    onCleanup,
  } = options;

  const { reactiveStore } = registerReactiveStore(alpine, storeKey, store);

  const subscriptions: Unsubscribe[] = [];
  if (subscribe) {
    subscriptions.push(subscribe(reactiveStore));
  }

  registerStoreMagic(alpine, magicKey, magicAccessor ?? (() => reactiveStore));

  wireControllerLifecycle(alpine, controller, {
    subscriptions,
    onCleanup: onCleanup ? [onCleanup] : undefined,
  });

  return { reactiveStore };
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
