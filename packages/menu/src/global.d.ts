/// <reference types="@types/alpinejs" />

export type MenuOrientation = "horizontal" | "vertical";

export interface MenuStore {
  instances: Record<string, import("./store.js").MenuInstance>;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  activeItem(id: string): string | null;
  register(id: string, options?: import("./store.js").MenuInstanceOptions): void;
  unregister(id: string): void;
  registerItem(
    menuId: string,
    itemId: string,
    options?: import("./store.js").MenuItemOptions
  ): void;
  unregisterItem(menuId: string, itemId: string): void;
  bindMenu(menuId: string, container: HTMLElement | null): void;
  bindTrigger(menuId: string, trigger: HTMLElement | null): void;
  handleOutsideClick(menuId: string, event: MouseEvent): void;
  setActiveItem(menuId: string, itemId: string | null): void;
  selectItem(menuId: string, itemId: string): void;
  handleKeydown(menuId: string, event: KeyboardEvent): void;
  itemProps(menuId: string, itemId: string): Record<string, string | number | boolean | undefined>;
  menuProps(menuId: string): Record<string, string | boolean | undefined>;
  destroy(): void;
}

export interface MenuPluginOptions {
  onLockChange?: (locked: boolean) => void;
}

export function menuOptions<const T extends MenuPluginOptions>(options: T): T;
export function createMenuStore(config?: { onLockChange?: (locked: boolean) => void }): MenuStore;

export default function menuPlugin(options?: MenuPluginOptions): import("alpinejs").PluginCallback;

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
