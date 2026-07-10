/**
 * Alpine.js integration for `@ailuracode/alpine-command`.
 *
 * Thin adapter that wires {@link CommandController} into
 * `$store.command` and the `$command` magic.
 */

import type { Alpine } from "alpinejs";
import { CommandController } from "./controller";
import type {
  CommandAlpine,
  CommandPluginCallback,
  CommandPluginOptions,
  CommandStore,
} from "./types";

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

    // Build a mutable store object that delegates to the controller.
    const store: CommandStore = {
      search: "",
      activeIndex: 0,
      visible: false,
      items: {} as CommandStore["items"],

      get isOpen() {
        return this.visible;
      },

      get filteredItems() {
        const defaultFilter = (i: import("./types").CommandItem, s: string): boolean => {
          if (!s.trim()) {
            return true;
          }
          const query = s.trim().toLowerCase();
          const haystack = [i.label, i.group ?? "", i.shortcut ?? "", ...(i.keywords ?? [])]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        };
        const filter = options.filter ?? defaultFilter;
        const list = Object.values(this.items).filter(
          (item) => !item.disabled && filter(item, this.search)
        );
        if (this.activeIndex >= list.length) {
          this.activeIndex = Math.max(list.length - 1, 0);
        }
        return list;
      },

      get groupedItems() {
        const groups: Record<string, import("./types").CommandItem[]> = {};
        for (const item of this.filteredItems) {
          const group = item.group ?? "General";
          groups[group] ??= [];
          groups[group].push(item);
        }
        return groups;
      },

      open: () => controller.open(),
      close: () => controller.close(),
      toggle: () => controller.toggle(),
      register: (item) => controller.register(item),
      unregister: (id) => controller.unregister(id),
      run: (id) => controller.run(id),
      handleKeydown: (event) => controller.handleKeydown(event),
      destroy: () => controller.destroy(),
    };

    Alpine.store(COMMAND_STORE_KEY, store);
    const reactiveStore = Alpine.store(COMMAND_STORE_KEY);

    // Sync controller state into the reactive store on state changes.
    // Alpine's reactive proxy detects mutations to the store properties,
    // so replacing them triggers re-renders.
    controller.on("open", () => {
      reactiveStore.visible = true;
      reactiveStore.search = "";
      reactiveStore.activeIndex = 0;
    });

    controller.on("close", () => {
      reactiveStore.visible = false;
      reactiveStore.search = "";
      reactiveStore.activeIndex = 0;
    });

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
