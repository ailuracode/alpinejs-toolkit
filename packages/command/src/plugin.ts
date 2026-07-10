import type AlpineType from "alpinejs";
import {
  type CommandController,
  type CommandStore,
  type CommandStoreConfig,
  createCommandController,
} from "./controller.js";

export {
  type CommandAction,
  type CommandController,
  type CommandItem,
  type CommandStore,
  type CommandStoreConfig,
  createCommandController,
  createCommandStore,
} from "./controller.js";

export interface CommandPluginOptions extends CommandStoreConfig {}

/** Builds typed command plugin options. */
export function commandOptions<const T extends CommandPluginOptions>(options: T): T {
  return options;
}

/** Alpine.js command palette plugin. Registers `$store.command`. */
export default function commandPlugin(
  options: CommandPluginOptions = {}
): AlpineType.PluginCallback {
  return function registerCommand(Alpine) {
    const controller: CommandController = createCommandController(options);
    const store: CommandStore = controller;
    Alpine.store("command", store);
    Alpine.magic("command", () => Alpine.store("command"));
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      command: CommandStore;
    }
    interface Magics<T> {
      $command: CommandStore;
    }
  }
}
