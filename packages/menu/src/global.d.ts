/// <reference types="@types/alpinejs" />

import type { MenuInstance, MenuInstanceOptions } from "./types";

export type {
  CreateMenuOptions,
  MenuControllerConfig,
  MenuInstance,
  MenuInstanceOptions,
  MenuItemOptions,
  MenuItemState,
  MenuOrientation,
} from "./types";

export interface MenuStore {
  readonly instances: Record<string, MenuInstance>;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  activeItem(id: string): string | null;
  register(id: string, options?: MenuInstanceOptions): void;
  unregister(id: string): void;
  registerItem(menuId: string, itemId: string, options?: import("./types").MenuItemOptions): void;
  unregisterItem(menuId: string, itemId: string): void;
  bindMenu(menuId: string, container: HTMLElement | null): void;
  bindTrigger(menuId: string, trigger: HTMLElement | null): void;
  handleOutsideClick(menuId: string, event: MouseEvent): void;
  setActiveItem(menuId: string, itemId: string | null): void;
  selectItem(menuId: string, itemId: string): void;
  handleKeydown(menuId: string, event: KeyboardEvent): void;
  handleWindowOutsideClick(event: MouseEvent, menuIds?: readonly string[]): void;
  handleWindowKeydown(event: KeyboardEvent, menuIds?: readonly string[]): void;
  itemProps(menuId: string, itemId: string): Record<string, string | number | boolean | undefined>;
  menuProps(menuId: string): Record<string, string | boolean | undefined>;
  destroy(): void;
}

export function createMenuController(
  config?: import("./types").MenuControllerConfig,
  id?: string
): import("./types").MenuController;

export function createMenuStore(config?: import("./types").MenuControllerConfig): MenuStore;

export default function menuPlugin(
  options?: import("./types").CreateMenuOptions
): import("alpinejs").PluginCallback;

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
