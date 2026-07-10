/**
 * Menu controller — the framework-agnostic core of
 * `@ailuracode/alpine-menu`. Manages menu instances with
 * open/close state, keyboard navigation, exclusive mode,
 * and ARIA props.
 *
 * Emits typed `open`, `close`, and `select` events so consumers
 * can react programmatically.
 *
 * Mutating methods accept an `instances` record as their first
 * parameter. This allows the Alpine plugin to pass the reactive
 * proxy's `instances` so mutations trigger Alpine reactivity,
 * while standalone usage passes the controller's own record.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core";
import type { MenuEvents } from "./events";
import type {
  MenuControllerConfig,
  MenuInstance,
  MenuInstanceOptions,
  MenuItemOptions,
  MenuItemState,
  MenuStore,
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
 * Mutating methods accept an `instances` record so the caller controls
 * which object is mutated — critical for Alpine's reactive proxy.
 */
export class MenuController extends BaseController<MenuEvents> {
  readonly instances: Record<string, MenuInstance>;
  #exclusive: boolean;
  #lockCount = 0;
  #onLockChange?: (locked: boolean) => void;

  constructor(
    instances: Record<string, MenuInstance>,
    config: MenuControllerConfig = {},
    id?: string
  ) {
    super(id ?? generateId("menu"));
    this.instances = instances;
    this.#exclusive = config.exclusive ?? true;
    this.#onLockChange = config.onLockChange;
  }

  register(
    instances: Record<string, MenuInstance>,
    id: string,
    options: MenuInstanceOptions = {}
  ): void {
    if (this.isDestroyed) {
      return;
    }
    instances[id] = createInstance(options);
  }

  unregister(instances: Record<string, MenuInstance>, id: string): void {
    if (this.isDestroyed) {
      return;
    }
    if (this.isOpen(instances, id)) {
      this.close(instances, id);
    }
    delete instances[id];
  }

  registerItem(
    instances: Record<string, MenuInstance>,
    menuId: string,
    itemId: string,
    options: MenuItemOptions = {}
  ): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(instances, menuId);
    const existing = instance.items.find((item) => item.id === itemId);
    if (existing) {
      existing.disabled = options.disabled ?? existing.disabled;
      existing.parentId = options.parentId ?? existing.parentId;
      return;
    }

    instance.items.push({
      id: itemId,
      disabled: options.disabled ?? false,
      parentId: options.parentId ?? null,
    });
  }

  unregisterItem(instances: Record<string, MenuInstance>, menuId: string, itemId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = instances[menuId];
    if (!instance) {
      return;
    }

    instance.items = instance.items.filter((item) => item.id !== itemId);
    if (instance.activeItemId === itemId) {
      instance.activeItemId = firstItem(instance);
    }
  }

  open(instances: Record<string, MenuInstance>, id: string): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(instances, id);
    if (instance.open) {
      return;
    }

    const closedCount = this.#closeOtherMenus(instances, id);

    instance.open = true;
    if (!instance.activeItemId) {
      instance.activeItemId = firstItem(instance);
    }

    if (closedCount === 0) {
      this.#setLock(true);
    }

    instance.onOpen?.();
    queueMicrotask(() => focusActiveMenu(instance));

    this.emit("open", { menuId: id });
  }

  close(instances: Record<string, MenuInstance>, id: string): void {
    if (this.isDestroyed) {
      return;
    }
    this.#closeMenu(instances, id);
  }

  toggle(instances: Record<string, MenuInstance>, id: string): void {
    if (this.isOpen(instances, id)) {
      this.close(instances, id);
    } else {
      this.open(instances, id);
    }
  }

  isOpen(instances: Record<string, MenuInstance>, id: string): boolean {
    return instances[id]?.open ?? false;
  }

  activeItem(instances: Record<string, MenuInstance>, id: string): string | null {
    return instances[id]?.activeItemId ?? null;
  }

  setActiveItem(
    instances: Record<string, MenuInstance>,
    menuId: string,
    itemId: string | null
  ): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(instances, menuId);
    if (itemId === null) {
      instance.activeItemId = null;
      return;
    }

    const item = instance.items.find((entry) => entry.id === itemId);
    if (item && !item.disabled) {
      instance.activeItemId = itemId;
    }
  }

  bindMenu(
    instances: Record<string, MenuInstance>,
    menuId: string,
    container: HTMLElement | null
  ): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(instances, menuId);
    instance.container = container;

    if (instance.open) {
      queueMicrotask(() => focusActiveMenu(instance));
    }
  }

  bindTrigger(
    instances: Record<string, MenuInstance>,
    menuId: string,
    trigger: HTMLElement | null
  ): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = this.#getOrCreate(instances, menuId);
    instance.trigger = trigger;
  }

  handleOutsideClick(
    instances: Record<string, MenuInstance>,
    menuId: string,
    event: MouseEvent
  ): void {
    const instance = instances[menuId];
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

    this.close(instances, menuId);
  }

  selectItem(instances: Record<string, MenuInstance>, menuId: string, itemId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = instances[menuId];
    const item = instance?.items.find((entry) => entry.id === itemId);
    if (!(instance && item) || item.disabled) {
      return;
    }

    instance.activeItemId = itemId;
    instance.onSelect?.(itemId);

    this.emit("select", { menuId, itemId });

    if (instance.closeOnSelect) {
      this.#closeMenu(instances, menuId);
    }
  }

  handleKeydown(
    instances: Record<string, MenuInstance>,
    menuId: string,
    event: KeyboardEvent
  ): void {
    if (this.isDestroyed) {
      return;
    }
    const instance = instances[menuId];
    if (instance?.open) {
      handleMenuKeydown(
        menuId,
        instance,
        event,
        (id, itemId) => this.selectItem(instances, id, itemId),
        (id) => this.close(instances, id)
      );
      queueMicrotask(() => focusActiveMenu(instance));
    }
  }

  handleWindowOutsideClick(
    instances: Record<string, MenuInstance>,
    event: MouseEvent,
    menuIds?: readonly string[]
  ): void {
    const ids = menuIds ?? Object.keys(instances);
    for (const menuId of ids) {
      this.handleOutsideClick(instances, menuId, event);
    }
  }

  handleWindowKeydown(
    instances: Record<string, MenuInstance>,
    event: KeyboardEvent,
    menuIds?: readonly string[]
  ): void {
    const ids = menuIds ?? Object.keys(instances);
    for (const menuId of ids) {
      if (this.isOpen(instances, menuId)) {
        this.handleKeydown(instances, menuId, event);
        return;
      }
    }
  }

  itemProps(
    instances: Record<string, MenuInstance>,
    menuId: string,
    itemId: string
  ): Record<string, string | number | boolean | undefined> {
    const instance = instances[menuId];
    const item = instance?.items.find((entry) => entry.id === itemId);
    const active = instance?.activeItemId === itemId;

    return {
      role: "menuitem",
      tabindex: active ? 0 : -1,
      "aria-disabled": item?.disabled ?? false,
    };
  }

  menuProps(
    instances: Record<string, MenuInstance>,
    menuId: string
  ): Record<string, string | boolean | undefined> {
    const instance = instances[menuId];
    return {
      role: "menu",
      "aria-orientation": instance?.orientation,
    };
  }

  /**
   * Returns a store-shaped object for Alpine's `$store.menu`.
   * The store delegates to this controller using the controller's
   * own instances record (no Alpine proxy involved).
   */
  toStore(): MenuStore {
    return {
      instances: this.instances,
      register: (id, opts) => this.register(this.instances, id, opts),
      unregister: (id) => this.unregister(this.instances, id),
      registerItem: (id, itemId, opts) => this.registerItem(this.instances, id, itemId, opts),
      unregisterItem: (id, itemId) => this.unregisterItem(this.instances, id, itemId),
      open: (id) => this.open(this.instances, id),
      close: (id) => this.close(this.instances, id),
      toggle: (id) => this.toggle(this.instances, id),
      isOpen: (id) => this.isOpen(this.instances, id),
      activeItem: (id) => this.activeItem(this.instances, id),
      setActiveItem: (id, itemId) => this.setActiveItem(this.instances, id, itemId),
      bindMenu: (id, container) => this.bindMenu(this.instances, id, container),
      bindTrigger: (id, trigger) => this.bindTrigger(this.instances, id, trigger),
      handleOutsideClick: (id, event) => this.handleOutsideClick(this.instances, id, event),
      selectItem: (id, itemId) => this.selectItem(this.instances, id, itemId),
      handleKeydown: (id, event) => this.handleKeydown(this.instances, id, event),
      handleWindowOutsideClick: (event, ids) =>
        this.handleWindowOutsideClick(this.instances, event, ids),
      handleWindowKeydown: (event, ids) => this.handleWindowKeydown(this.instances, event, ids),
      itemProps: (id, itemId) => this.itemProps(this.instances, id, itemId),
      menuProps: (id) => this.menuProps(this.instances, id),
      destroy: () => this.destroy(),
    };
  }

  #getOrCreate(instances: Record<string, MenuInstance>, id: string): MenuInstance {
    instances[id] ??= createInstance();
    return instances[id];
  }

  #setLock(locked: boolean): void {
    if (locked) {
      if (this.#lockCount === 0) {
        this.#onLockChange?.(true);
      }
      this.#lockCount++;
      return;
    }

    if (this.#lockCount === 0) {
      return;
    }

    this.#lockCount--;
    if (this.#lockCount === 0) {
      this.#onLockChange?.(false);
    }
  }

  #closeMenu(instances: Record<string, MenuInstance>, id: string, suppressLock = false): void {
    const instance = instances[id];
    if (!instance?.open) {
      return;
    }

    instance.open = false;

    if (!suppressLock) {
      this.#setLock(false);
    }

    instance.onClose?.();

    this.emit("close", { menuId: id });
  }

  #closeOtherMenus(instances: Record<string, MenuInstance>, openingId: string): number {
    const opening = instances[openingId];
    const openingGroup = opening?.group ?? null;
    let closedCount = 0;

    for (const menuId of Object.keys(instances)) {
      if (menuId === openingId || !this.isOpen(instances, menuId)) {
        continue;
      }

      const other = instances[menuId];
      const shouldClose =
        this.#exclusive !== false || (openingGroup !== null && other.group === openingGroup);

      if (shouldClose) {
        this.#closeMenu(instances, menuId, true);
        closedCount++;
      }
    }

    return closedCount;
  }

  destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    // Close all open menus and clean up before calling super.destroy()
    for (const id of Object.keys(this.instances)) {
      if (this.isOpen(this.instances, id)) {
        this.#closeMenu(this.instances, id);
      }
      delete this.instances[id];
    }
    this.#lockCount = 0;
    this.#onLockChange?.(false);
    super.destroy();
  }
}

/**
 * Creates a MenuController. Framework-agnostic, no Alpine dependency.
 */
export function createMenuController(config?: MenuControllerConfig, id?: string): MenuController {
  return new MenuController({}, config, id);
}

/**
 * Creates a MenuStore (store-shaped object) directly.
 * Backward-compatible alias.
 */
export function createMenuStore(config: MenuControllerConfig = {}): MenuStore {
  return new MenuController({}, config).toStore();
}
