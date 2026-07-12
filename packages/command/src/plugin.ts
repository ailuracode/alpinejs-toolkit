/**
 * Alpine.js integration for `@ailuracode/alpine-command`.
 */

import type { Alpine } from "alpinejs";
import { CommandController } from "./controller.js";
import type {
  CommandAlpine,
  CommandPluginCallback,
  CommandPluginOptions,
  CommandStore,
} from "./types.js";

/** Key under which the command store is registered on `$store`. */
const COMMAND_STORE_KEY = "command";

interface ReactiveCommandStore extends CommandStore {
  revision: number;
}

/** Builds the reactive Alpine store from a controller instance. */
export function createCommandStoreFromController(
  controller: CommandController
): ReactiveCommandStore {
  const store: ReactiveCommandStore = {
    revision: 0,
    get search() {
      void store.revision;
      return controller.search;
    },
    set search(value) {
      controller.search = value;
    },
    get activeIndex() {
      void store.revision;
      return controller.activeIndex;
    },
    set activeIndex(value) {
      controller.activeIndex = value;
    },
    get visible() {
      void store.revision;
      return controller.visible;
    },
    set visible(value) {
      if (value) {
        controller.open();
      } else {
        controller.close();
      }
    },
    get items() {
      void store.revision;
      return controller.items as Record<string, import("./types.js").CommandItem>;
    },
    get isOpen() {
      void store.revision;
      return controller.isOpen;
    },
    get executionState() {
      void store.revision;
      return controller.executionState;
    },
    get runningId() {
      void store.revision;
      return controller.runningId;
    },
    get currentPageId() {
      void store.revision;
      return controller.currentPageId;
    },
    get pageStack() {
      void store.revision;
      return controller.pageStack;
    },
    get pages() {
      void store.revision;
      return controller.pages;
    },
    get loadingIds() {
      void store.revision;
      return controller.loadingIds;
    },
    get pinnedIds() {
      void store.revision;
      return controller.pinnedIds;
    },
    get recentIds() {
      void store.revision;
      return controller.recentIds;
    },
    open: () => controller.open(),
    close: () => controller.close(),
    toggle: () => controller.toggle(),
    register: (item) => controller.register(item),
    unregister: (id) => controller.unregister(id),
    run: (id) => controller.run(id),
    cancelRun: () => controller.cancelRun(),
    handleKeydown: (event) => controller.handleKeydown(event),
    pushPage: (page) => controller.pushPage(page),
    popPage: () => controller.popPage(),
    goBack: () => controller.goBack(),
    itemState: (id) => controller.itemState(id),
    inputProps: () => controller.inputProps(),
    listboxProps: () => controller.listboxProps(),
    optionProps: (id) => controller.optionProps(id),
    get filteredItems() {
      void store.revision;
      return controller.filteredItems;
    },
    get visibleItems() {
      void store.revision;
      return controller.visibleItems;
    },
    get groupedItems() {
      void store.revision;
      return controller.groupedItems;
    },
    destroy: () => controller.destroy(),
  };

  return store;
}

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CommandPluginOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function commandPlugin(options: CommandPluginOptions = {}): CommandPluginCallback {
  return function registerCommand(alpine: Alpine): void {
    const Alpine = alpine as unknown as CommandAlpine;
    const controller = new CommandController(options.id, options);
    const store = createCommandStoreFromController(controller);

    Alpine.store(COMMAND_STORE_KEY, store);
    const reactiveStore = Alpine.store(COMMAND_STORE_KEY) as ReactiveCommandStore;

    const syncFromController = (): void => {
      reactiveStore.revision++;
    };

    controller.on("open", syncFromController);
    controller.on("close", syncFromController);
    controller.on("change", syncFromController);

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
