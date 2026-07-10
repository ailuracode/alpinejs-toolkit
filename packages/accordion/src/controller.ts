/**
 * Accordion controller — the framework-agnostic core of
 * `@ailuracode/alpine-accordion`. Manages accordion groups with
 * open/close state, keyboard navigation, and ARIA props.
 *
 * Emits a typed `change` event on every open/close transition so
 * consumers can react programmatically.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core";
import type { AccordionEvents } from "./events";
import type {
  AccordionChangeSource,
  AccordionGroup,
  AccordionGroupOptions,
  AccordionItem,
  AccordionMode,
  AccordionStore,
} from "./types";

function enabledItems(group: AccordionGroup): AccordionItem[] {
  return group.items.filter((item) => !item.disabled);
}

function itemIndex(group: AccordionGroup, itemId: string): number {
  return enabledItems(group).findIndex((item) => item.id === itemId);
}

function normalizeDefaultOpen(mode: AccordionMode, value?: string | string[]): string[] {
  if (!value) {
    return [];
  }

  const ids = Array.isArray(value) ? value : [value];
  return mode === "single" && ids.length > 0 ? [ids[0]] : ids;
}

function createGroup(options: AccordionGroupOptions = {}): AccordionGroup {
  const mode = options.mode ?? "single";
  return {
    mode,
    open: {},
    activeItemId: null,
    items: [],
    defaultOpen: normalizeDefaultOpen(mode, options.defaultOpen),
    onChange: options.onChange,
  };
}

/**
 * Headless accordion controller. Manages multiple accordion groups
 * with open/close state, keyboard navigation, and ARIA props.
 */
export class AccordionController extends BaseController<AccordionEvents> {
  #groups: Record<string, AccordionGroup> = {};

  constructor(id?: string) {
    super(id ?? generateId("accordion"));
  }

  get groups(): Readonly<Record<string, AccordionGroup>> {
    return this.#groups;
  }

  register(accordionId: string, options: AccordionGroupOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }
    this.#groups[accordionId] = createGroup(options);
  }

  unregister(accordionId: string): void {
    if (this.isDestroyed) {
      return;
    }
    delete this.#groups[accordionId];
  }

  registerItem(accordionId: string, itemId: string, disabled = false): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#getOrCreate(accordionId);
    const existing = group.items.find((item) => item.id === itemId);
    if (existing) {
      existing.disabled = disabled;
      return;
    }
    group.items.push({ id: itemId, disabled });

    if (group.defaultOpen.includes(itemId) && !disabled) {
      this.open(accordionId, itemId);
      group.activeItemId ??= itemId;
    }
  }

  unregisterItem(accordionId: string, itemId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[accordionId];
    if (!group) {
      return;
    }

    group.items = group.items.filter((item) => item.id !== itemId);
    delete group.open[itemId];
  }

  open(accordionId: string, itemId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[accordionId];
    const item = group?.items.find((entry) => entry.id === itemId);
    if (!(group && item) || item.disabled) {
      return;
    }

    if (group.mode === "single") {
      for (const id of Object.keys(group.open)) {
        if (group.open[id]) {
          group.open[id] = false;
        }
      }
      group.open[itemId] = true;
    } else {
      group.open[itemId] = true;
    }

    this.#emitChange(accordionId, "user");
    group.onChange?.(this.openIds(accordionId));
  }

  close(accordionId: string, itemId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[accordionId];
    if (!group?.open[itemId]) {
      return;
    }

    group.open[itemId] = false;
    this.#emitChange(accordionId, "user");
    group.onChange?.(this.openIds(accordionId));
  }

  toggle(accordionId: string, itemId: string): void {
    if (this.isOpen(accordionId, itemId)) {
      this.close(accordionId, itemId);
    } else {
      this.open(accordionId, itemId);
    }
  }

  isOpen(accordionId: string, itemId: string): boolean {
    return this.#groups[accordionId]?.open[itemId] ?? false;
  }

  openIds(accordionId: string): string[] {
    const open = this.#groups[accordionId]?.open ?? {};
    return Object.entries(open)
      .filter(([, isOpen]) => isOpen)
      .map(([id]) => id);
  }

  activeItem(accordionId: string): string | null {
    return this.#groups[accordionId]?.activeItemId ?? null;
  }

  setActiveItem(accordionId: string, itemId: string | null): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[accordionId];
    if (!group) {
      return;
    }

    if (itemId === null) {
      group.activeItemId = null;
      return;
    }

    const item = group.items.find((entry) => entry.id === itemId);
    if (item && !item.disabled) {
      group.activeItemId = itemId;
    }
  }

  handleKeydown(accordionId: string, event: KeyboardEvent): void {
    const group = this.#groups[accordionId];
    if (!group) {
      return;
    }

    const items = enabledItems(group);
    if (items.length === 0) {
      return;
    }

    if (!group.activeItemId) {
      group.activeItemId = items[0]?.id ?? null;
    }

    const currentIndex = group.activeItemId ? itemIndex(group, group.activeItemId) : 0;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        group.activeItemId = items[(currentIndex + 1) % items.length]?.id ?? null;
        break;
      case "ArrowUp":
        event.preventDefault();
        group.activeItemId = items[(currentIndex - 1 + items.length) % items.length]?.id ?? null;
        break;
      case "Home":
        event.preventDefault();
        group.activeItemId = items[0]?.id ?? null;
        break;
      case "End":
        event.preventDefault();
        group.activeItemId = items[items.length - 1]?.id ?? null;
        break;
      default:
        break;
    }
  }

  triggerProps(
    accordionId: string,
    itemId: string
  ): Record<string, string | number | boolean | undefined> {
    const open = this.isOpen(accordionId, itemId);
    const active = this.activeItem(accordionId) === itemId;
    return {
      "aria-expanded": open,
      "aria-controls": `${accordionId}-panel-${itemId}`,
      id: `${accordionId}-trigger-${itemId}`,
      tabindex: active ? 0 : -1,
    };
  }

  panelProps(accordionId: string, itemId: string): Record<string, string | boolean | undefined> {
    const open = this.isOpen(accordionId, itemId);
    return {
      id: `${accordionId}-panel-${itemId}`,
      role: "region",
      "aria-labelledby": `${accordionId}-trigger-${itemId}`,
      "aria-hidden": open ? undefined : true,
    };
  }

  /**
   * Returns a store-shaped object for Alpine's `$store.accordion`.
   * The store delegates to this controller.
   */
  toStore(): AccordionStore {
    return {
      groups: this.#groups,
      register: (id, opts) => this.register(id, opts),
      unregister: (id) => this.unregister(id),
      registerItem: (id, itemId, disabled) => this.registerItem(id, itemId, disabled),
      unregisterItem: (id, itemId) => this.unregisterItem(id, itemId),
      open: (id, itemId) => this.open(id, itemId),
      close: (id, itemId) => this.close(id, itemId),
      toggle: (id, itemId) => this.toggle(id, itemId),
      isOpen: (id, itemId) => this.isOpen(id, itemId),
      openIds: (id) => this.openIds(id),
      activeItem: (id) => this.activeItem(id),
      setActiveItem: (id, itemId) => this.setActiveItem(id, itemId),
      handleKeydown: (id, event) => this.handleKeydown(id, event),
      triggerProps: (id, itemId) => this.triggerProps(id, itemId),
      panelProps: (id, itemId) => this.panelProps(id, itemId),
      destroy: () => this.destroy(),
    };
  }

  #getOrCreate(accordionId: string): AccordionGroup {
    this.#groups[accordionId] ??= createGroup();
    return this.#groups[accordionId];
  }

  #emitChange(accordionId: string, source: AccordionChangeSource): void {
    this.emit("change", {
      groupId: accordionId,
      openIds: this.openIds(accordionId),
      source,
    });
  }
}

/**
 * Creates an AccordionController and returns a store-shaped object.
 * Convenience for non-Alpine consumers.
 */
export function createAccordionController(id?: string): AccordionController {
  return new AccordionController(id);
}

/**
 * Creates an AccordionStore (store-shaped object) directly.
 * Backward-compatible alias.
 */
export function createAccordionStore(): AccordionStore {
  return new AccordionController().toStore();
}
