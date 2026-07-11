import type AlpineType from "alpinejs";
import { createPermissions, type PermissionsController } from "./controller.js";
import type {
  PermissionAdapter,
  PermissionsMagic,
  PermissionsPluginOptions,
  PermissionsStore,
} from "./types.js";

interface PermissionsAlpine extends AlpineType.Alpine {
  cleanup?(callback: () => void): void;
}

const PERMISSIONS_STORE_KEY = "permissions";

function createPermissionsStore(controller: PermissionsController): PermissionsStore {
  const store: PermissionsStore = {
    registry: { ...controller.getRegistry() },

    get(name: string) {
      return store.registry[name];
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
      store.registry = { ...controller.getRegistry() };
      return () => {
        dispose();
        store.registry = { ...controller.getRegistry() };
      };
    },
  };

  return store;
}

function syncReactiveRegistry(
  reactiveStore: PermissionsStore,
  controller: PermissionsController
): void {
  reactiveStore.registry = { ...controller.getRegistry() };
}

function registerPermissions(
  Alpine: PermissionsAlpine,
  options: PermissionsPluginOptions = {}
): PermissionsController {
  const controller = options.controller ?? createPermissions();
  const adapters = options.adapters ?? [];

  for (const adapter of adapters) {
    controller.register(adapter);
  }

  const store = createPermissionsStore(controller);
  Alpine.store(PERMISSIONS_STORE_KEY, store);
  const reactiveStore = Alpine.store(PERMISSIONS_STORE_KEY) as PermissionsStore;

  controller.on("change", () => {
    syncReactiveRegistry(reactiveStore, controller);
  });

  Alpine.magic(PERMISSIONS_STORE_KEY, () => reactiveStore as PermissionsMagic);

  // Query and observe current permission state without prompting.
  for (const name of Object.keys(controller.getRegistry())) {
    void controller.query(name);
    void controller.watch(name);
  }

  if (typeof Alpine.cleanup === "function") {
    Alpine.cleanup(() => {
      controller.destroy();
    });
  }

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
