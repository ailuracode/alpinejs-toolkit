export type MenuOrientation = "vertical" | "horizontal";

export type MenuItemState = {
  id: string;
  disabled: boolean;
  parentId: string | null;
};

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

export type MenuItemOptions = {
  disabled?: boolean;
  parentId?: string | null;
};

export type MenuInstanceOptions = {
  orientation?: MenuOrientation;
  closeOnSelect?: boolean;
  /** When store `exclusive` is `false`, only one menu per group may be open at a time. */
  group?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onSelect?: (itemId: string) => void;
};

export type MenuStore = {
  /** Reactive registry of menu instances. */
  instances: Record<string, MenuInstance>;
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
};

type MenuStoreConfig = {
  /** When true (default), opening a menu closes all other open menus. */
  exclusive?: boolean;
  onLockChange?: (locked: boolean) => void;
};

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

/** Creates the headless menu controller. */
export function createMenuStore(config: MenuStoreConfig = {}): MenuStore {
  const exclusive = config.exclusive ?? true;
  let lockCount = 0;

  function setLock(locked: boolean): void {
    if (locked) {
      if (lockCount === 0) {
        config.onLockChange?.(true);
      }
      lockCount++;
      return;
    }

    if (lockCount === 0) {
      return;
    }

    lockCount--;
    if (lockCount === 0) {
      config.onLockChange?.(false);
    }
  }

  function getOrCreate(store: MenuStore, id: string): MenuInstance {
    store.instances[id] ??= createInstance();
    return store.instances[id];
  }

  function closeMenu(menuStore: MenuStore, id: string, suppressLock = false): void {
    const instance = menuStore.instances[id];
    if (!instance?.open) {
      return;
    }

    instance.open = false;

    if (!suppressLock) {
      setLock(false);
    }

    instance.onClose?.();
  }

  function closeOtherMenus(menuStore: MenuStore, openingId: string): number {
    const opening = menuStore.instances[openingId];
    const openingGroup = opening?.group ?? null;
    let closedCount = 0;

    for (const menuId of Object.keys(menuStore.instances)) {
      if (menuId === openingId || !menuStore.isOpen(menuId)) {
        continue;
      }

      const other = menuStore.instances[menuId];
      const shouldClose =
        exclusive !== false || (openingGroup !== null && other.group === openingGroup);

      if (shouldClose) {
        closeMenu(menuStore, menuId, true);
        closedCount++;
      }
    }

    return closedCount;
  }

  const store: MenuStore = {
    instances: {},

    register(id, options = {}) {
      this.instances[id] = createInstance(options);
    },

    unregister(id) {
      if (this.isOpen(id)) {
        this.close(id);
      }
      delete this.instances[id];
    },

    registerItem(menuId, itemId, options = {}) {
      const instance = getOrCreate(this, menuId);
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
    },

    unregisterItem(menuId, itemId) {
      const instance = this.instances[menuId];
      if (!instance) {
        return;
      }

      instance.items = instance.items.filter((item) => item.id !== itemId);
      if (instance.activeItemId === itemId) {
        instance.activeItemId = firstItem(instance);
      }
    },

    open(id) {
      const instance = getOrCreate(this, id);
      if (instance.open) {
        return;
      }

      const closedCount = closeOtherMenus(this, id);

      instance.open = true;
      if (!instance.activeItemId) {
        instance.activeItemId = firstItem(instance);
      }

      if (closedCount === 0) {
        setLock(true);
      }

      instance.onOpen?.();
      queueMicrotask(() => focusActiveMenu(instance));
    },

    close(id) {
      closeMenu(this, id);
    },

    toggle(id) {
      if (this.isOpen(id)) {
        this.close(id);
      } else {
        this.open(id);
      }
    },

    isOpen(id) {
      return this.instances[id]?.open ?? false;
    },

    activeItem(id) {
      return this.instances[id]?.activeItemId ?? null;
    },

    setActiveItem(menuId, itemId) {
      const instance = getOrCreate(this, menuId);
      if (itemId === null) {
        instance.activeItemId = null;
        return;
      }

      const item = instance.items.find((entry) => entry.id === itemId);
      if (item && !item.disabled) {
        instance.activeItemId = itemId;
      }
    },

    bindMenu(menuId, container) {
      const instance = getOrCreate(this, menuId);
      instance.container = container;

      if (instance.open) {
        queueMicrotask(() => focusActiveMenu(instance));
      }
    },

    bindTrigger(menuId, trigger) {
      const instance = getOrCreate(this, menuId);
      instance.trigger = trigger;
    },

    handleOutsideClick(menuId, event) {
      const instance = this.instances[menuId];
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
    },

    selectItem(menuId, itemId) {
      const instance = this.instances[menuId];
      const item = instance?.items.find((entry) => entry.id === itemId);
      if (!(instance && item) || item.disabled) {
        return;
      }

      instance.activeItemId = itemId;
      instance.onSelect?.(itemId);

      if (instance.closeOnSelect) {
        this.close(menuId);
      }
    },

    handleKeydown(menuId, event) {
      const instance = this.instances[menuId];
      if (instance?.open) {
        handleMenuKeydown(
          menuId,
          instance,
          event,
          this.selectItem.bind(this),
          this.close.bind(this)
        );
        queueMicrotask(() => focusActiveMenu(instance));
      }
    },

    handleWindowOutsideClick(event, menuIds) {
      const ids = menuIds ?? Object.keys(this.instances);
      for (const menuId of ids) {
        this.handleOutsideClick(menuId, event);
      }
    },

    handleWindowKeydown(event, menuIds) {
      const ids = menuIds ?? Object.keys(this.instances);
      for (const menuId of ids) {
        if (this.isOpen(menuId)) {
          this.handleKeydown(menuId, event);
          return;
        }
      }
    },

    itemProps(menuId, itemId) {
      const instance = this.instances[menuId];
      const item = instance?.items.find((entry) => entry.id === itemId);
      const active = instance?.activeItemId === itemId;

      return {
        role: "menuitem",
        tabindex: active ? 0 : -1,
        "aria-disabled": item?.disabled ?? false,
      };
    },

    menuProps(menuId) {
      const instance = this.instances[menuId];
      return {
        role: "menu",
        "aria-orientation": instance?.orientation,
      };
    },

    destroy() {
      for (const id of Object.keys(this.instances)) {
        this.unregister(id);
      }
      lockCount = 0;
      config.onLockChange?.(false);
    },
  };

  return store;
}

export type MenuController = MenuStore;

/** Alias matching the controller-based architecture naming. */
export function createMenuController(config: MenuStoreConfig = {}): MenuController {
  return createMenuStore(config);
}
