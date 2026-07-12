/**
 * Alpine adapter for the command controller.
 *
 * Fields are direct properties (not getters) so the plugin can mirror
 * controller state onto Alpine's reactive store proxy.
 */

import type { CommandController } from "../controller.js";
import type { CommandItem, CommandItemState, CommandPage, CommandStore } from "../types.js";

/** Mirrors controller state into a plain store object for Alpine. */
export function syncCommandStore(store: CommandStore, controller: CommandController): void {
  store.search = controller.search;
  store.activeIndex = controller.activeIndex;
  store.visible = controller.visible;
  store.isOpen = controller.isOpen;
  store.items = { ...controller.items } as Record<string, CommandItem>;
  store.executionState = controller.executionState;
  store.runningId = controller.runningId;
  store.currentPageId = controller.currentPageId;
  Object.assign(store, {
    pageStack: [...controller.pageStack],
    pages: { ...controller.pages } as Record<string, CommandPage>,
    loadingIds: [...controller.loadingIds],
    pinnedIds: [...controller.pinnedIds],
    recentIds: [...controller.recentIds],
    visibleItems: [...controller.visibleItems] as CommandItemState[],
    filteredItems: [...controller.filteredItems],
    groupedItems: { ...controller.groupedItems },
  });
}

/** Builds the {@link CommandStore} installed at `$store.command`. */
export function createCommandAlpineStore(controller: CommandController): CommandStore {
  const store = {
    search: controller.search,
    activeIndex: controller.activeIndex,
    visible: controller.visible,
    isOpen: controller.isOpen,
    items: { ...controller.items } as Record<string, CommandItem>,
    executionState: controller.executionState,
    runningId: controller.runningId,
    currentPageId: controller.currentPageId,
    pageStack: [...controller.pageStack],
    pages: { ...controller.pages } as Record<string, CommandPage>,
    loadingIds: [...controller.loadingIds],
    pinnedIds: [...controller.pinnedIds],
    recentIds: [...controller.recentIds],
    visibleItems: [...controller.visibleItems] as CommandItemState[],
    filteredItems: [...controller.filteredItems],
    groupedItems: { ...controller.groupedItems },

    open: () => controller.open(),
    close: () => controller.close(),
    toggle: () => controller.toggle(),
    register: (item: CommandItem) => controller.register(item),
    unregister: (id: string) => controller.unregister(id),
    run: (id: string) => controller.run(id),
    cancelRun: () => controller.cancelRun(),
    handleKeydown: (event: KeyboardEvent) => controller.handleKeydown(event),
    pushPage: (page: CommandPage) => controller.pushPage(page),
    popPage: () => controller.popPage(),
    goBack: () => controller.goBack(),
    itemState: (id: string) => controller.itemState(id),
    inputProps: () => controller.inputProps(),
    listboxProps: () => controller.listboxProps(),
    optionProps: (id: string) => controller.optionProps(id),
    destroy: () => controller.destroy(),
  } satisfies CommandStore;

  return store;
}
