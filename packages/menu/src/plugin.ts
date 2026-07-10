/**
 * Alpine.js integration for `@ailuracode/alpine-menu`.
 *
 * Thin adapter that wires {@link MenuController} into
 * `$store.menu` and the `$menu` magic.
 *
 * The store methods pass `this.instances` (the Alpine reactive proxy's
 * record) to every controller call so mutations trigger Alpine reactivity.
 */

import type { Alpine } from "alpinejs";
import { MenuController } from "./controller";
import type {
  CreateMenuOptions,
  MenuAlpine,
  MenuInstance,
  MenuPluginCallback,
  MenuStore,
} from "./types";

/** Key under which the menu store is registered on `$store`. */
const MENU_STORE_KEY = "menu";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateMenuOptions} to configure the controller,
 * or `{}` for the package defaults.
 */
export function menuPlugin(options: CreateMenuOptions = {}): MenuPluginCallback {
  return function registerMenu(alpine: Alpine): void {
    const Alpine = alpine as unknown as MenuAlpine;

    // The shared instances record. Both the controller and the store
    // operate on this same object. The Alpine reactive proxy wraps it
    // so that mutations detected by the proxy trigger re-renders.
    const instances: Record<string, MenuInstance> = {};

    const controller = new MenuController(
      instances,
      { exclusive: options.exclusive, scroll: options.scroll },
      options.id
    );

    // Every store method passes `this.instances` (the Alpine reactive
    // proxy's version of the record) to the controller so that mutations
    // go through the proxy and trigger Alpine reactivity.
    const store: MenuStore = {
      instances,
      register(this: MenuStore, id, opts) {
        controller.register(this.instances, id, opts);
      },
      unregister(this: MenuStore, id) {
        controller.unregister(this.instances, id);
      },
      registerItem(this: MenuStore, id, itemId, opts) {
        controller.registerItem(this.instances, id, itemId, opts);
      },
      unregisterItem(this: MenuStore, id, itemId) {
        controller.unregisterItem(this.instances, id, itemId);
      },
      open(this: MenuStore, id) {
        controller.open(this.instances, id);
      },
      close(this: MenuStore, id) {
        controller.close(this.instances, id);
      },
      toggle(this: MenuStore, id) {
        controller.toggle(this.instances, id);
      },
      isOpen(this: MenuStore, id) {
        return controller.isOpen(this.instances, id);
      },
      activeItem(this: MenuStore, id) {
        return controller.activeItem(this.instances, id);
      },
      setActiveItem(this: MenuStore, id, itemId) {
        controller.setActiveItem(this.instances, id, itemId);
      },
      bindMenu(this: MenuStore, id, container) {
        controller.bindMenu(this.instances, id, container);
      },
      bindTrigger(this: MenuStore, id, trigger) {
        controller.bindTrigger(this.instances, id, trigger);
      },
      handleOutsideClick(this: MenuStore, id, event) {
        controller.handleOutsideClick(this.instances, id, event);
      },
      selectItem(this: MenuStore, id, itemId) {
        controller.selectItem(this.instances, id, itemId);
      },
      handleKeydown(this: MenuStore, id, event) {
        controller.handleKeydown(this.instances, id, event);
      },
      handleWindowOutsideClick(this: MenuStore, event, ids) {
        controller.handleWindowOutsideClick(this.instances, event, ids);
      },
      handleWindowKeydown(this: MenuStore, event, ids) {
        controller.handleWindowKeydown(this.instances, event, ids);
      },
      itemProps(this: MenuStore, id, itemId) {
        return controller.itemProps(this.instances, id, itemId);
      },
      menuProps(this: MenuStore, id) {
        return controller.menuProps(this.instances, id);
      },
      destroy: () => controller.destroy(),
    };

    Alpine.store(MENU_STORE_KEY, store);

    Alpine.magic(MENU_STORE_KEY, () => Alpine.store(MENU_STORE_KEY));

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

/** Builds typed menu plugin options. */
export function menuOptions<const T extends CreateMenuOptions>(options: T): T {
  return options;
}
