import type AlpineType from "alpinejs";
import { createMenuController, type MenuController, type MenuStore } from "./controller.js";

export {
  createMenuController,
  createMenuStore,
  type MenuController,
  type MenuInstanceOptions,
  type MenuItemOptions,
  type MenuOrientation,
  type MenuStore,
} from "./controller.js";

export interface MenuPluginOptions {
  /** When true (default), opening a menu closes all other open menus. */
  exclusive?: boolean;
  onLockChange?: (locked: boolean) => void;
}

/** Builds typed menu plugin options. */
export function menuOptions<const T extends MenuPluginOptions>(options: T): T {
  return options;
}

/** Alpine.js menu plugin. Registers `$store.menu`. */
export default function menuPlugin(options: MenuPluginOptions = {}): AlpineType.PluginCallback {
  return function registerMenu(Alpine) {
    const controller: MenuController = createMenuController({
      exclusive: options.exclusive,
      onLockChange: options.onLockChange,
    });
    const store: MenuStore = controller;
    Alpine.store("menu", store);
    Alpine.magic("menu", () => Alpine.store("menu"));
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      menu: MenuStore;
    }
    interface Magics<T> {
      $menu: MenuStore;
    }
  }
}
