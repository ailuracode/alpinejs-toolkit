import type AlpineType from "alpinejs";
import { createMenuStore, type MenuStore } from "./store.js";

export {
  createMenuStore,
  type MenuInstanceOptions,
  type MenuItemOptions,
  type MenuOrientation,
  type MenuStore,
} from "./store.js";

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
    const store = createMenuStore({
      exclusive: options.exclusive,
      onLockChange: options.onLockChange,
    });
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
