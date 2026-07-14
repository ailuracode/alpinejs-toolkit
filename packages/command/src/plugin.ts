/**
 * Alpine.js integration for `@ailuracode/alpine-command`.
 */

import type { Alpine } from "alpinejs";
import { createCommandAlpineStore, syncCommandStore } from "./alpine/store.js";
import { CommandController } from "./controller.js";
import type {
  CommandAlpine,
  CommandPluginCallback,
  CommandPluginOptions,
  CommandStore,
} from "./types.js";

/** Key under which the command store is registered on `$store`. */
const COMMAND_STORE_KEY = "command";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CommandPluginOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function commandPlugin(options: CommandPluginOptions = {}): CommandPluginCallback {
  return function registerCommand(alpine: Alpine): void {
    const Alpine = alpine as unknown as CommandAlpine;
    const controller = new CommandController(options.id, options);
    const store = createCommandAlpineStore(controller);

    Alpine.store(COMMAND_STORE_KEY, store);
    const reactiveStore = Alpine.store(COMMAND_STORE_KEY) as CommandStore;

    let syncing = false;
    const syncFromController = (): void => {
      syncing = true;
      syncCommandStore(reactiveStore, controller);
      syncing = false;
    };

    controller.on("open", syncFromController);
    controller.on("close", syncFromController);
    controller.on("change", syncFromController);

    alpine.effect(() => {
      if (syncing) {
        return;
      }
      const nextSearch = reactiveStore.search;
      if (controller.search !== nextSearch) {
        controller.search = nextSearch;
      }
    });

    syncFromController();
    Alpine.magic(COMMAND_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed command plugin options. */
export function commandOptions<const T extends CommandPluginOptions>(options: T): T {
  return options;
}

/** @deprecated Use {@link createCommandAlpineStore} via the plugin adapter. */
export function createCommandStoreFromController(controller: CommandController): CommandStore {
  return createCommandAlpineStore(controller);
}
