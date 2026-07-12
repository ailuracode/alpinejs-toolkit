/**
 * Accordion controller — the framework-agnostic core of
 * `@ailuracode/alpine-accordion`. Manages accordion groups with
 * open/close state, keyboard navigation, and ARIA props.
 *
 * Emits a typed `change` event on every open/close transition so
 * consumers can react programmatically.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core";
import { SelectionController } from "@ailuracode/alpine-selection";
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

function snapshotGroup(group: AccordionGroup): AccordionGroup {
  return {
    ...group,
    open: { ...group.open },
    items: group.items.map((item) => ({ ...item })),
    defaultOpen: [...group.defaultOpen],
  };
}

/**
 * Headless accordion controller. Manages multiple accordion groups
 * with open/close state, keyboard navigation, and ARIA props.
 */
export class AccordionController extends BaseController<AccordionEvents> {
  #groups: Record<string, AccordionGroup> = {};
  readonly #selection = new SelectionController();

  constructor(id?: string) {
    super(id ?? generateId("accordion"));
  }

  /** Whether a group is registered. */
  hasGroup(accordionId: string): boolean {
    return accordionId in this.#groups;
  }

  /**
   * Returns shallow snapshots of all groups for adapter sync.
   * Mutating the returned objects does not affect controller state.
   */
  snapshotGroups(): Record<string, AccordionGroup> {
    const result: Record<string, AccordionGroup> = {};
    for (const [id, group] of Object.entries(this.#groups)) {
      result[id] = snapshotGroup(group);
    }
    return result;
  }

  register(accordionId: string, options: AccordionGroupOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }
    const group = createGroup(options);
    this.#groups[accordionId] = group;
    this.#selection.create(accordionId, {
      mode: group.mode === "single" ? "single" : "multiple",
      defaultValue: group.mode === "single" ? (group.defaultOpen[0] ?? null) : group.defaultOpen,
      keys: [],
    });
    this.#syncSelectionKeys(accordionId);
    this.#syncOpenRecord(accordionId);
    this.#emitChange(accordionId, "initialization");
  }

  unregister(accordionId: string): void {
    if (this.isDestroyed) {
      return;
    }
    this.#emitChange(accordionId, "initialization");
    this.#selection.destroy(accordionId);
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
      this.#emitChange(accordionId, "user");
      return;
    }
    group.items.push({ id: itemId, disabled });
    this.#syncSelectionKeys(accordionId);

    if (group.defaultOpen.includes(itemId) && !disabled) {
      this.open(accordionId, itemId);
      group.activeItemId ??= itemId;
      return;
    }

    this.#emitChange(accordionId, "user");
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
    this.#syncSelectionKeys(accordionId);
    this.#syncOpenRecord(accordionId);
    this.#emitChange(accordionId, "user");
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
      this.#selection.replace(accordionId, itemId);
    } else if (!this.#selection.isSelected(accordionId, itemId)) {
      const selected = this.#selection.getSnapshot(accordionId).selectedKeys;
      this.#selection.setValue(accordionId, [...selected, itemId]);
    }

    this.#syncOpenRecord(accordionId);
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

    if (group.mode === "single") {
      this.#selection.clear(accordionId);
    } else {
      const selected = this.#selection
        .getSnapshot(accordionId)
        .selectedKeys.filter((key) => key !== itemId);
      this.#selection.setValue(accordionId, selected);
    }

    this.#syncOpenRecord(accordionId);
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
    return this.#selection.isSelected(accordionId, itemId);
  }

  openIds(accordionId: string): string[] {
    return [...this.#selection.getSnapshot(accordionId).selectedKeys];
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
      this.#emitChange(accordionId, "user");
      return;
    }

    const item = group.items.find((entry) => entry.id === itemId);
    if (item && !item.disabled) {
      group.activeItemId = itemId;
      this.#emitChange(accordionId, "user");
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

    this.#emitChange(accordionId, "user");
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
   * Prefer {@link createAccordionStore} for new code.
   *
   * @deprecated Use `createAccordionStore()` or `createAccordionStoreFromController()`.
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

  #syncSelectionKeys(accordionId: string): void {
    const group = this.#groups[accordionId];
    if (!group) {
      return;
    }
    const keys = group.items.map((item) => item.id);
    const disabled = group.items.filter((item) => item.disabled).map((item) => item.id);
    this.#selection.setKeys(accordionId, keys);
    this.#selection.setDisabledKeys(accordionId, disabled);
  }

  #syncOpenRecord(accordionId: string): void {
    const group = this.#groups[accordionId];
    if (!group) {
      return;
    }
    const selected = new Set(this.#selection.getSnapshot(accordionId).selectedKeys);
    const nextOpen: Record<string, boolean> = {};
    for (const item of group.items) {
      nextOpen[item.id] = selected.has(item.id);
    }
    group.open = nextOpen;
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#selection.destroy();
    super.destroy();
  }
}

/**
 * Creates an AccordionController and returns a store-shaped object.
 * Convenience for non-Alpine consumers.
 */
export function createAccordionController(id?: string): AccordionController {
  return new AccordionController(id);
}
