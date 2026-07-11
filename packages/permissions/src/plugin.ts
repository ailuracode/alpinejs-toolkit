import type AlpineType from "alpinejs";
import { createPermissions, type PermissionsController } from "./controller.js";
import type {
  PermissionAdapter,
  PermissionSnapshot,
  PermissionsMagic,
  PermissionsPluginOptions,
  PermissionsStore,
} from "./types.js";

interface PermissionsAlpine extends AlpineType.Alpine {
  cleanup?(callback: () => void): void;
}

function createPermissionsStore(controller: PermissionsController): PermissionsStore {
  const state = {
    registry: controller.getRegistry() as Record<string, PermissionSnapshot>,
  };

  const store: PermissionsStore = {
    get registry() {
      return state.registry;
    },

    get(name: string) {
      return controller.get(name);
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
      state.registry = controller.getRegistry() as Record<string, PermissionSnapshot>;
      return () => {
        dispose();
        state.registry = controller.getRegistry() as Record<string, PermissionSnapshot>;
      };
    },
  };

  controller.on("change", () => {
    state.registry = controller.getRegistry() as Record<string, PermissionSnapshot>;
  });

  return store;
}

function registerPermissions(
  Alpine: PermissionsAlpine,
  options: PermissionsPluginOptions = {}
): PermissionsController {
  const controller = options.controller ?? createPermissions();

  for (const adapter of options.adapters ?? []) {
    controller.register(adapter);
  }

  const store = createPermissionsStore(controller);
  Alpine.store("permissions", store);
  Alpine.magic("permissions", () => store as PermissionsMagic);

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
