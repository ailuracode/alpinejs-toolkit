import type AlpineType from "alpinejs";
import { createPermissions, type PermissionsController } from "./controller.js";
import { bridgeControllerStore } from "./core-deps.js";
import type {
  PermissionAdapter,
  PermissionSnapshot,
  PermissionsPluginOptions,
  PermissionsStore,
} from "./types.js";
import { DEFAULT_PERMISSIONS_MAGIC_KEY, DEFAULT_PERMISSIONS_STORE_KEY } from "./types.js";

interface PermissionsAlpine extends AlpineType.Alpine {
  cleanup?(callback: () => void): void;
}

function syncRegistry(
  registry: Record<string, PermissionSnapshot>,
  controller: PermissionsController
): void {
  const next = controller.getRegistry();

  for (const key of Object.keys(registry)) {
    if (!(key in next)) {
      Reflect.deleteProperty(registry, key);
    }
  }

  Object.assign(registry, next);
}

function createPermissionsStore(controller: PermissionsController): PermissionsStore {
  const registry: Record<string, PermissionSnapshot> = { ...controller.getRegistry() };

  const store: PermissionsStore = {
    registry,

    get(name: string) {
      return registry[name];
    },

    query(name: string) {
      return controller.query(name);
    },

    request(name: string, options?: unknown) {
      return controller.request(name, options);
    },

    refresh(name: string) {
      return controller.refresh(name);
    },

    watch(name: string) {
      return controller.watch(name);
    },

    register(adapter: PermissionAdapter) {
      const dispose = controller.register(adapter);
      syncRegistry(registry, controller);
      return () => {
        dispose();
        syncRegistry(registry, controller);
      };
    },
  };

  return store;
}

function syncReactiveRegistry(
  reactiveStore: PermissionsStore,
  controller: PermissionsController
): void {
  syncRegistry(reactiveStore.registry as Record<string, PermissionSnapshot>, controller);
}

function registerPermissions(
  Alpine: PermissionsAlpine,
  options: PermissionsPluginOptions = {}
): PermissionsController {
  // Resolve the registration keys once. The magic follows the store
  // so renames stay in sync: a single `storeKey` is enough when both
  // must move out of a collided name.
  const storeKey = options.storeKey ?? DEFAULT_PERMISSIONS_STORE_KEY;
  const magicKey = options.magicKey ?? options.storeKey ?? DEFAULT_PERMISSIONS_MAGIC_KEY;

  const controller = options.controller ?? createPermissions();
  const adapters = options.adapters ?? [];

  for (const adapter of adapters) {
    controller.register(adapter);
  }

  bridgeControllerStore<PermissionsStore, PermissionsController>({
    alpine: Alpine,
    storeKey,
    magicKey,
    store: createPermissionsStore(controller),
    controller,
    packageName: "permissions",
    subscribe: (reactiveStore) => {
      const changeUnsub = controller.on("change", () => {
        syncReactiveRegistry(reactiveStore, controller);
      });

      // Query and observe current permission state without prompting.
      for (const name of Object.keys(controller.getRegistry())) {
        void controller.query(name);
        void controller.watch(name);
      }

      return changeUnsub;
    },
  });

  return controller;
}

/** Alpine.js permissions plugin. Registers `$store.permissions` and `$permissions`. */
export function permissionsPlugin(
  optionsOrAlpine?: PermissionsPluginOptions | AlpineType.Alpine
): undefined | ((Alpine: AlpineType.Alpine) => PermissionsController) {
  if (optionsOrAlpine && typeof (optionsOrAlpine as AlpineType.Alpine).magic === "function") {
    registerPermissions(optionsOrAlpine as PermissionsAlpine, {});
    return;
  }

  const options = (optionsOrAlpine as PermissionsPluginOptions | undefined) ?? {};

  return (Alpine: AlpineType.Alpine) => {
    return registerPermissions(Alpine as PermissionsAlpine, options);
  };
}

export default permissionsPlugin;
