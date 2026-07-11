/**
 * Menu controller — the framework-agnostic core of
 * `@ailuracode/alpine-menu`. Manages menu instances with
 * open/close state, keyboard navigation, exclusive mode,
 * and ARIA props.
 *
 * Emits typed `open`, `close`, `select`, and `change` events so
 * consumers can react programmatically and mirror state into
 * framework adapters.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core";
import type { ScrollStore } from "@ailuracode/alpine-scroll";
import type { MenuEvents } from "./events";
import type {
  MenuControllerConfig,
  MenuInstance,
  MenuInstanceOptions,
  MenuItemOptions,
  MenuItemState,
} from "./types";

function enabledItems(instance: MenuInstance): MenuItemState[] {
  return instance.items.filter((item) => !item.disabled);
}

function itemIndex(instance: MenuInstance, itemId: string): number {
  return enabledItems(instance).findIndex((item) => item.id === itemId);
}

function moveActive(instance: MenuInstance, delta: number): string | null {
  const items = enabledItems(instance);
  if (items.length === 0) {
    return null;
  }

  const currentIndex = instance.activeItemId ? itemIndex(instance, instance.activeItemId) : -1;
  const nextIndex = (currentIndex + delta + items.length) % items.length;
  return items[nextIndex]?.id ?? null;
}

function firstItem(instance: MenuInstance): string | null {
  return enabledItems(instance)[0]?.id ?? null;
}

function lastItem(instance: MenuInstance): string | null {
  const items = enabledItems(instance);
  return items[items.length - 1]?.id ?? null;
}

function createInstance(options: MenuInstanceOptions = {}): MenuInstance {
  return {
    open: false,
    activeItemId: null,
    orientation: options.orientation ?? "vertical",
    closeOnSelect: options.closeOnSelect ?? true,
    group: options.group ?? null,
    items: [],
    container: null,
    trigger: null,
    onOpen: options.onOpen,
    onClose: options.onClose,
    onSelect: options.onSelect,
  };
}

function snapshotMenuInstance(instance: MenuInstance): MenuInstance {
  return {
    ...instance,
    items: instance.items.map((item) => ({ ...item })),
  };
}

function focusActiveItem(container: HTMLElement | null): void {
  if (!container) {
    return;
  }

  const active = container.querySelector<HTMLElement>('[role="menuitem"][tabindex="0"]');
  active?.focus();
}

function focusActiveMenu(instance: MenuInstance): void {
  focusActiveItem(instance.container);
}

function handleMenuKeydown(
  menuId: string,
  instance: MenuInstance,
  event: KeyboardEvent,
  selectItem: (menuId: string, itemId: string) => void,
  close: (menuId: string) => void
): void {
  const vertical = instance.orientation === "vertical";
  const horizontal = instance.orientation === "horizontal";

  if (event.key === "ArrowDown" && vertical) {
    event.preventDefault();
    instance.activeItemId = moveActive(instance, 1);
    return;
  }

  if (event.key === "ArrowUp" && vertical) {
    event.preventDefault();
    instance.activeItemId = moveActive(instance, -1);
    return;
  }

  if (event.key === "ArrowRight" && horizontal) {
    event.preventDefault();
    instance.activeItemId = moveActive(instance, 1);
    return;
  }

  if (event.key === "ArrowLeft" && horizontal) {
    event.preventDefault();
    instance.activeItemId = moveActive(instance, -1);
    return;
  }

  if (event.key === "Home") {
    event.preventDefault();
    instance.activeItemId = firstItem(instance);
    return;
  }

  if (event.key === "End") {
    event.preventDefault();
    instance.activeItemId = lastItem(instance);
    return;
  }

  if ((event.key === "Enter" || event.key === " ") && instance.activeItemId) {
    event.preventDefault();
    selectItem(menuId, instance.activeItemId);
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    close(menuId);
  }
}

/**
 * Headless menu controller. Manages multiple menu instances with
 * open/close state, keyboard navigation, exclusive mode, and ARIA props.
 *
 * The controller owns all mutable state. Alpine and other adapters
 * mirror snapshots through {@link MenuController.snapshotInstances}
 * and the `change` event.
 */
export class MenuController extends BaseController<MenuEvents> {
  #instances: Record<string, MenuInstance> = {};
  #exclusive: boolean;
  #lockCount = 0;
  #lockHandle: string | null = null;
  #scroll: ScrollStore | undefined;

  constructor(config: MenuControllerConfig = {}, id?: string) {
    super(id ?? generateId("menu"));
    this.#exclusive = config.exclusive ?? true;
    this.#scroll = config.scroll;
  }

  /** Whether a menu instance is registered. */
  hasInstance(id: string): boolean {
    return id in this.#instances;
  }

  /**
   * Returns a shallow snapshot of all instances for adapter sync.
   * Mutating the returned objects does not affect controller state.
   */
  snapshotInstances(): Record<string, MenuInstance> {
    const result: Record<string, MenuInstance> = {};
    for (const [id, instance] of Object.entries(this.#instances)) {
      result[id] = snapshotMenuInstance(instance);
    }
    return result;
  }

  register(id: string, options: MenuInstanceOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }
    this.#instances[id] = createInstance(options);
    this.#notifyChange(id);
  }

  unregister(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    if (this.isOpen(id)) {
      this.close(id);
    }
    delete this.#instances[id];
    this.#notifyChange(id);
  }

  registerItem(menuId: string, itemId: string, options: MenuItemOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(menuId);
    const existing = instance.items.find((item) => item.id === itemId);
    if (existing) {
      existing.disabled = options.disabled ?? existing.disabled;
      existing.parentId = options.parentId ?? existing.parentId;
      this.#notifyChange(menuId);
      return;
    }

    instance.items.push({
      id: itemId,
      disabled: options.disabled ?? false,
      parentId: options.parentId ?? null,
    });
    this.#notifyChange(menuId);
  }

  unregisterItem(menuId: string, itemId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#instances[menuId];
    if (!instance) {
      return;
    }

    instance.items = instance.items.filter((item) => item.id !== itemId);
    if (instance.activeItemId === itemId) {
      instance.activeItemId = firstItem(instance);
    }
    this.#notifyChange(menuId);
  }

  open(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(id);
    if (instance.open) {
      return;
    }

    const closedCount = this.#closeOtherMenus(id);

    instance.open = true;
    if (!instance.activeItemId) {
      instance.activeItemId = firstItem(instance);
    }

    if (closedCount === 0) {
      this.#updateScrollLock(true);
    }

    instance.onOpen?.();
    queueMicrotask(() => focusActiveMenu(instance));

    this.emit("open", { menuId: id });
    this.#notifyChange(id);
  }

  close(id: string): void {
    if (this.isDestroyed) {
      return;
    }
    this.#closeMenu(id);
  }

  toggle(id: string): void {
    if (this.isOpen(id)) {
      this.close(id);
    } else {
      this.open(id);
    }
  }

  isOpen(id: string): boolean {
    return this.#instances[id]?.open ?? false;
  }

  activeItem(id: string): string | null {
    return this.#instances[id]?.activeItemId ?? null;
  }

  setActiveItem(menuId: string, itemId: string | null): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(menuId);
    if (itemId === null) {
      instance.activeItemId = null;
      this.#notifyChange(menuId);
      return;
    }

    const item = instance.items.find((entry) => entry.id === itemId);
    if (item && !item.disabled) {
      instance.activeItemId = itemId;
      this.#notifyChange(menuId);
    }
  }

  bindMenu(menuId: string, container: HTMLElement | null): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(menuId);
    instance.container = container;

    if (instance.open) {
      queueMicrotask(() => focusActiveMenu(instance));
    }
    this.#notifyChange(menuId);
  }

  bindTrigger(menuId: string, trigger: HTMLElement | null): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(menuId);
    instance.trigger = trigger;
    this.#notifyChange(menuId);
  }

  handleOutsideClick(menuId: string, event: MouseEvent): void {
    const instance = this.#instances[menuId];
    if (!instance?.open) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (instance.trigger?.contains(target) || instance.container?.contains(target)) {
      return;
    }

    this.close(menuId);
  }

  selectItem(menuId: string, itemId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#instances[menuId];
    const item = instance?.items.find((entry) => entry.id === itemId);
    if (!(instance && item) || item.disabled) {
      return;
    }

    instance.activeItemId = itemId;
    instance.onSelect?.(itemId);

    this.emit("select", { menuId, itemId });

    if (instance.closeOnSelect) {
      this.#closeMenu(menuId);
    } else {
      this.#notifyChange(menuId);
    }
  }

  handleKeydown(menuId: string, event: KeyboardEvent): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#instances[menuId];
    if (instance?.open) {
      const previousActive = instance.activeItemId;
      handleMenuKeydown(
        menuId,
        instance,
        event,
        (id, itemId) => this.selectItem(id, itemId),
        (id) => this.close(id)
      );
      queueMicrotask(() => focusActiveMenu(instance));
      if (instance.activeItemId !== previousActive) {
        this.#notifyChange(menuId);
      }
    }
  }

  handleWindowOutsideClick(event: MouseEvent, menuIds?: readonly string[]): void {
    const ids = menuIds ?? Object.keys(this.#instances);
    for (const menuId of ids) {
      this.handleOutsideClick(menuId, event);
    }
  }

  handleWindowKeydown(event: KeyboardEvent, menuIds?: readonly string[]): void {
    const ids = menuIds ?? Object.keys(this.#instances);
    for (const menuId of ids) {
      if (this.isOpen(menuId)) {
        this.handleKeydown(menuId, event);
        return;
      }
    }
  }

  itemProps(menuId: string, itemId: string): Record<string, string | number | boolean | undefined> {
    const instance = this.#instances[menuId];
    const item = instance?.items.find((entry) => entry.id === itemId);
    const active = instance?.activeItemId === itemId;

    return {
      role: "menuitem",
      tabindex: active ? 0 : -1,
      "aria-disabled": item?.disabled ?? false,
    };
  }

  menuProps(menuId: string): Record<string, string | boolean | undefined> {
    const instance = this.#instances[menuId];
    return {
      role: "menu",
      "aria-orientation": instance?.orientation,
    };
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    for (const id of Object.keys(this.#instances)) {
      if (this.isOpen(id)) {
        this.#closeMenu(id);
      }
      delete this.#instances[id];
    }
    if (this.#lockHandle !== null) {
      this.#scroll?.unlock(this.#lockHandle);
      this.#lockHandle = null;
    }
    this.#lockCount = 0;
    super.destroy();
  }

  #getOrCreate(id: string): MenuInstance {
    this.#instances[id] ??= createInstance();
    return this.#instances[id];
  }

  #notifyChange(menuId?: string): void {
    this.emit("change", { menuId });
  }

  #updateScrollLock(locked: boolean): void {
    if (locked) {
      if (this.#lockCount === 0 && this.#scroll && this.#lockHandle === null) {
        this.#lockHandle = this.#scroll.lock("menu");
      }
      this.#lockCount++;
      return;
    }

    if (this.#lockCount === 0) {
      return;
    }

    this.#lockCount--;
    if (this.#lockCount === 0 && this.#lockHandle !== null) {
      this.#scroll?.unlock(this.#lockHandle);
      this.#lockHandle = null;
    }
  }

  #closeMenu(id: string, suppressLock = false): void {
    const instance = this.#instances[id];
    if (!instance?.open) {
      return;
    }

    instance.open = false;

    if (!suppressLock) {
      this.#updateScrollLock(false);
    }

    instance.onClose?.();

    this.emit("close", { menuId: id });
    this.#notifyChange(id);
  }

  #closeOtherMenus(openingId: string): number {
    const opening = this.#instances[openingId];
    const openingGroup = opening?.group ?? null;
    let closedCount = 0;

    for (const menuId of Object.keys(this.#instances)) {
      if (menuId === openingId || !this.isOpen(menuId)) {
        continue;
      }

      const other = this.#instances[menuId];
      const shouldClose =
        this.#exclusive !== false || (openingGroup !== null && other.group === openingGroup);

      if (shouldClose) {
        this.#closeMenu(menuId, true);
        closedCount++;
      }
    }

    return closedCount;
  }
}

/**
 * Creates a MenuController. Framework-agnostic, no Alpine dependency.
 */
export function createMenuController(config?: MenuControllerConfig, id?: string): MenuController {
  return new MenuController(config, id);
}
