/**
 * Public type contracts for `@ailuracode/alpine-menu`.
 *
 * Every public type lives in a `types.ts` module so consumers can import
 * them without pulling the implementation. The shape IS the contract.
 */

import type { ScrollStore } from "@ailuracode/alpine-scroll";
import type { Alpine as AlpineBase } from "alpinejs";
import type { Alpine, PluginCallback } from "./core-deps.js";

/** Menu orientation. */
export type MenuOrientation = "vertical" | "horizontal";

/** A menu item's registration state. */
export type MenuItemState = {
  id: string;
  disabled: boolean;
  parentId: string | null;
};

/** Internal representation of a menu instance. */
export type MenuInstance = {
  open: boolean;
  activeItemId: string | null;
  orientation: MenuOrientation;
  closeOnSelect: boolean;
  group: string | null;
  items: MenuItemState[];
  container: HTMLElement | null;
  trigger: HTMLElement | null;
  onOpen?: () => void;
  onClose?: () => void;
  onSelect?: (itemId: string) => void;
};

/** Options passed when registering a menu item. */
export type MenuItemOptions = {
  disabled?: boolean;
  parentId?: string | null;
};

/** Options passed when registering a menu instance. */
export type MenuInstanceOptions = {
  orientation?: MenuOrientation;
  closeOnSelect?: boolean;
  /** When store `exclusive` is `false`, only one menu per group may be open at a time. */
  group?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onSelect?: (itemId: string) => void;
};

/** Alpine-facing store surface. */
export interface MenuStore {
  /** Reactive registry of menu instances. */
  readonly instances: Record<string, MenuInstance>;
  open(id: string): void;
  close(id: string): void;
  toggle(id: string): void;
  isOpen(id: string): boolean;
  activeItem(id: string): string | null;
  register(id: string, options?: MenuInstanceOptions): void;
  unregister(id: string): void;
  registerItem(menuId: string, itemId: string, options?: MenuItemOptions): void;
  unregisterItem(menuId: string, itemId: string): void;
  bindMenu(menuId: string, container: HTMLElement | null): void;
  bindTrigger(menuId: string, trigger: HTMLElement | null): void;
  handleOutsideClick(menuId: string, event: MouseEvent): void;
  setActiveItem(menuId: string, itemId: string | null): void;
  selectItem(menuId: string, itemId: string): void;
  handleKeydown(menuId: string, event: KeyboardEvent): void;
  /** Close open menus on outside click — pass `menuIds` when wiring multiple menus on one page. */
  handleWindowOutsideClick(event: MouseEvent, menuIds?: readonly string[]): void;
  /** Route keyboard events to the first open menu in `menuIds` (defaults to all registered). */
  handleWindowKeydown(event: KeyboardEvent, menuIds?: readonly string[]): void;
  itemProps(menuId: string, itemId: string): Record<string, string | number | boolean | undefined>;
  menuProps(menuId: string): Record<string, string | boolean | undefined>;
  destroy(): void;
}

/** Options accepted by the menu plugin factory. */
export interface CreateMenuOptions {
  readonly id?: string;
  /** When true (default), opening a menu closes all other open menus. */
  readonly exclusive?: boolean;
  readonly scroll?: ScrollStore;
  /**
   * `$store.menu` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_MENU_STORE_KEY}. Set when the host
   * already owns a `menu` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the controller.
   */
  readonly storeKey?: string;
}

/** Default `$store.menu` key registered by {@link menuPlugin}. */
export const DEFAULT_MENU_STORE_KEY = "menu";

/** Controller-level config (no id). */
export type MenuControllerConfig = {
  exclusive?: boolean;
  scroll?: ScrollStore;
};

/** Typed view of `Alpine` the menu plugin uses internally. */
export type MenuAlpine = Alpine<{ menu: MenuStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type MenuPluginCallback = PluginCallback<AlpineBase>;
