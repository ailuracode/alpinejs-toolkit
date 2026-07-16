import type Base from "alpinejs";
import type { Cleanup } from "./cleanup";
import type { Unsubscribe } from "./event";
import {
  guardDirective,
  guardMagic,
  guardStore,
  untrackDirective,
  untrackMagic,
} from "./registration";
import type { Alpine } from "./type";

export interface Destroyable {
  destroy(): void;
}

export interface AlpineLifecycleHost extends Alpine {
  cleanup?: (callback: Cleanup) => void;
}

export interface WireControllerLifecycleOptions {
  readonly subscriptions?: readonly Unsubscribe[];
  readonly onCleanup?: readonly Cleanup[];
}

export interface ControllerStoreBridgeOptions<TStore, TController extends Destroyable> {
  alpine: Alpine;
  storeKey: string;
  store: TStore;
  controller: TController;
  packageName?: string;
  magicKey?: string;
  magicAccessor?: () => unknown;
  subscribe?: (reactiveStore: TStore) => Unsubscribe;
  onCleanup?: Cleanup;
  registrationOverride?: boolean;
}

export interface BridgeControllerDirectiveOptions {
  alpine: AlpineLifecycleHost;
  directiveKey: string;
  directive: Base.DirectiveCallback;
  controller?: Destroyable;
  packageName?: string;
  registrationOverride?: boolean;
}

export function wireControllerLifecycle(
  alpine: AlpineLifecycleHost,
  controller: Destroyable,
  options: WireControllerLifecycleOptions = {}
): void {
  if (!alpine.cleanup) {
    return;
  }

  alpine.cleanup(() => {
    const { subscriptions = [], onCleanup = [] } = options ?? {};

    for (let i = 0, len = subscriptions.length; i < len; i++) {
      subscriptions[i]();
    }
    for (let i = 0, len = onCleanup.length; i < len; i++) {
      onCleanup[i]();
    }
    controller.destroy();
  });
}

export function bridgeControllerStore<TStore, TController extends Destroyable>(
  options: ControllerStoreBridgeOptions<TStore, TController>
): void {
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

  const reactiveStore = guardStore(alpine, storeKey, store, packageName, {
    override: registrationOverride,
  });

  const subscriptions: Unsubscribe[] = [];
  if (subscribe) {
    subscriptions.push(subscribe(reactiveStore));
  }

  guardMagic(alpine, magicKey, magicAccessor ?? (() => reactiveStore), packageName, {
    override: registrationOverride,
  });

  const cleanups: Cleanup[] = [untrackMagic.bind(null, magicKey)];
  if (onCleanup) {
    cleanups.push(onCleanup);
  }

  wireControllerLifecycle(alpine, controller, {
    subscriptions,
    onCleanup: cleanups,
  });
}

export function bridgeControllerDirective(options: BridgeControllerDirectiveOptions): void {
  const {
    alpine,
    directiveKey,
    directive,
    controller,
    packageName = "alpine",
    registrationOverride = true,
  } = options;

  guardDirective(alpine, directiveKey, directive, packageName, {
    override: registrationOverride,
  });

  if (!controller) {
    return;
  }
  wireControllerLifecycle(alpine, controller, {
    onCleanup: [untrackDirective.bind(null, directiveKey)],
  });
}

export function syncRecordFromSnapshot<T extends Record<string, unknown>>(
  target: Record<string, unknown>,
  snapshot: T
): void {
  Object.keys(snapshot).map((k) => (target[k] = snapshot[k]));
  Object.keys(target).map((k) => !(k in snapshot) && delete target[k]);
}
