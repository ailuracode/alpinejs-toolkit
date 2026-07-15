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

import type Base from "alpinejs";
import type { Unsubscribe } from "./core/event";
import type { Alpine } from "./core/type";
import {
  guardDirective,
  guardMagic,
  guardStore,
  untrackDirective,
  untrackMagic,
} from "./registration";

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
  /**
   * Package name surfaced in the collision error message (e.g.
   * `"theme"` so the error reads `themePlugin()`). Defaults to
   * `"alpine"` — feature packages SHOULD pass their own short name
   * so the error message points to the right factory.
   */
  packageName?: string;
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
  /**
   * Forwarded to {@link guardStore} and {@link guardMagic}.
   *
   * Default: `true` — silently replace any prior registration. This
   * matches Alpine's native behaviour and keeps HMR / hot reloads /
   * repeated integration tests working. Set to `false` to refuse
   * overwrites and throw `RegistrationError("REGISTRATION_COLLISION")`
   * instead, surfacing collisions as bugs instead of silent clobbers.
   */
  registrationOverride?: boolean;
}

/** Result of {@link bridgeControllerStore}. */
export interface ControllerStoreBridge<TStore> {
  readonly reactiveStore: TStore;
}

/**
 * Wires the invariant controller-backed adapter sequence.
 *
 * Store field mirroring stays in `subscribe` so each package keeps
 * readable, domain-specific synchronization logic. Both `store` and
 * `magic` registrations route through {@link guardStore} and
 * {@link guardMagic}.
 *
 * Collision policy:
 *
 * - Default (`registrationOverride: true`) — silently replace any
 *   prior registration. Matches Alpine's native behaviour and keeps
 *   HMR, hot reloads, and repeated integration tests working
 *   without per-plugin opt-in.
 * - `{ registrationOverride: false }` — refuse to overwrite and
 *   throw `RegistrationError("REGISTRATION_COLLISION")`. Use when
 *   the host application or another toolkit plugin is expected to
 *   register the same key, so the collision surfaces as a bug
 *   instead of a silent clobber. Plugins that opt in here own the
 *   `Alpine.cleanup` lifecycle of their previous registration.
 */
export function bridgeControllerStore<TStore, TController extends Destroyable>(
  options: ControllerStoreBridgeOptions<TStore, TController>
): ControllerStoreBridge<TStore> {
  const {
    alpine,
    storeKey,
    store,
    controller,
    packageName = "alpine",
    magicKey = storeKey,
    magicAccessor,
    subscribe,
    onCleanup,
    registrationOverride = true,
  } = options;

  const guardOptions = { override: registrationOverride, silent: true };
  const { reactiveStore } = guardStore(alpine, storeKey, store, packageName, guardOptions);

  const subscriptions: Unsubscribe[] = [];
  if (subscribe) {
    subscriptions.push(subscribe(reactiveStore));
  }

  guardMagic(alpine, magicKey, magicAccessor ?? (() => reactiveStore), packageName, guardOptions);

  // Drop the guard's tracking entry when the controller goes away so
  // HMR / repeated integration tests do not collide with themselves.
  // Runs alongside the host's `onCleanup` so order with any DOM
  // teardown stays predictable.
  const untrack = (): void => {
    untrackMagic(magicKey);
  };

  wireControllerLifecycle(alpine, controller, {
    subscriptions,
    onCleanup: onCleanup ? [untrack, onCleanup] : [untrack],
  });

  return { reactiveStore };
}

/** Options for {@link bridgeControllerDirective}. */
export interface BridgeControllerDirectiveOptions<TController extends Destroyable | undefined> {
  alpine: AlpineLifecycleHost;
  /**
   * The directive name registered on Alpine (without the `x-` prefix the
   * consumer types in markup). Feature packages expose this through
   * their plugin options so the host can rename around a collision.
   */
  directiveKey: string;
  /** The directive handler wired into {@link Alpine.directive}. */
  directive: Base.DirectiveCallback;
  /**
   * Optional controller that owns the directive's lifecycle. When
   * omitted the bridge does not register any destroy hook — the
   * directive stays registered for the lifetime of the Alpine runtime.
   * Cleanup still calls `untrackDirective` so HMR and repeated
   * integration tests do not collide with themselves.
   */
  controller?: TController;
  /**
   * Package name surfaced in the collision error message (e.g.
   * `"alpine-child"` so the error reads `childPlugin()`). Defaults to
   * `"alpine"` — feature packages SHOULD pass their own short name so
   * the error message points to the right factory.
   */
  packageName?: string;
  /**
   * Forwarded to {@link guardDirective}.
   *
   * Default: `true` — silently replace any prior registration of the
   * same name. Matches Alpine's native behaviour and keeps HMR, hot
   * reloads, and repeated integration tests working. Set to `false`
   * to refuse overwrites and throw `RegistrationError("REGISTRATION_COLLISION")`
   * instead, surfacing collisions as bugs instead of silent clobbers.
   */
  registrationOverride?: boolean;
}

/**
 * Wires the invariant controller-backed directive sequence.
 *
 * Counterpart to {@link bridgeControllerStore} for plugins that
 * register Alpine directives instead of store + magic pairs (e.g.
 * `x-child`, `x-gesture`). Routes the directive through
 * {@link guardDirective} so collisions surface as
 * `RegistrationError("REGISTRATION_COLLISION")` instead of silently
 * overwriting an existing directive of the same name.
 *
 * Cleanup order (when `controller` is supplied):
 *
 * 1. `controller.destroy()` — release any held resources
 * 2. `untrackDirective` — clear the guard's tracking entry so the
 *    next plugin instance can re-register without colliding with
 *    itself across HMR boundaries or repeated integration tests.
 *
 * Each step is idempotent. When `Alpine.cleanup` is missing the
 * bridge cannot perform any cleanup; the directive stays registered
 * for the lifetime of the Alpine runtime.
 */
export function bridgeControllerDirective<TController extends Destroyable | undefined>(
  options: BridgeControllerDirectiveOptions<TController>
): void {
  const {
    alpine,
    directiveKey,
    directive,
    controller,
    packageName = "alpine",
    registrationOverride = true,
  } = options;

  const guardOptions = { override: registrationOverride, silent: true };
  guardDirective(alpine as Alpine, directiveKey, directive, packageName, guardOptions);

  if (!controller) {
    return;
  }

  wireControllerLifecycle(alpine, controller, {
    onCleanup: [
      () => {
        untrackDirective(directiveKey);
      },
    ],
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
