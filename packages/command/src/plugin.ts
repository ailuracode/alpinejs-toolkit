/**
 * Alpine.js integration for `@ailuracode/alpine-command`.
 */

import type { Alpine } from "alpinejs";
import { createCommandAlpineStore, syncCommandStore } from "./alpine/store.js";
import { CommandController } from "./controller.js";
import { bridgeControllerStore } from "./core-deps.js";
import {
  type CommandAlpine,
  type CommandPluginCallback,
  type CommandPluginOptions,
  type CommandStore,
  DEFAULT_COMMAND_MAGIC_KEY,
  DEFAULT_COMMAND_STORE_KEY,
} from "./types.js";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CommandPluginOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function commandPlugin(options: CommandPluginOptions = {}): CommandPluginCallback {
  // Resolve the registration keys once. The magic follows the store
  // so renames stay in sync: a single `storeKey` is enough when both
  // must move out of a collided name.
  const storeKey = options.storeKey ?? DEFAULT_COMMAND_STORE_KEY;
  const magicKey = options.magicKey ?? options.storeKey ?? DEFAULT_COMMAND_MAGIC_KEY;

  return function registerCommand(alpine: Alpine): void {
    const Alpine = alpine as unknown as CommandAlpine;
    const controller = new CommandController(options.id, options);
    const store = createCommandAlpineStore(controller);

    bridgeControllerStore<CommandStore, CommandController>({
      alpine: Alpine,
      storeKey,
      magicKey,
      store,
      controller,
      packageName: "command",
      subscribe: (reactiveStore) => {
        let syncing = false;
        const syncFromController = (): void => {
          syncing = true;
          syncCommandStore(reactiveStore, controller);
          syncing = false;
        };

        const openUnsub = controller.on("open", syncFromController);
        const closeUnsub = controller.on("close", syncFromController);
        const changeUnsub = controller.on("change", syncFromController);

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

        return (): void => {
          openUnsub();
          closeUnsub();
          changeUnsub();
        };
      },
    });
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
