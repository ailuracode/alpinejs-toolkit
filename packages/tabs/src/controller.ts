/**
 * Tabs controller — the framework-agnostic core of
 * `@ailuracode/alpine-tabs`. Manages tab groups with selection,
 * keyboard navigation, URL sync, and ARIA props.
 *
 * Emits a typed `change` event on every selection so consumers
 * can react programmatically.
 */

import { BaseController, generateId, safeWindow } from "@ailuracode/alpine-core";
import {
  firstSelectableKey,
  lastSelectableKey,
  moveSelectableKey,
  SelectionController,
} from "@ailuracode/alpine-selection";
import type { TabsEvents } from "./events";
import type { TabsGroup, TabsGroupOptions, TabsStore } from "./types";

function moveTab(
  group: TabsGroup,
  delta: number,
  selection: SelectionController,
  groupId: string
): string | null {
  const keys = group.items.map((item) => item.id);
  const disabled = group.items.filter((item) => item.disabled).map((item) => item.id);
  const current =
    group.activation === "manual"
      ? selection.getSnapshot(groupId).activeKey
      : selection.getSnapshot(groupId).value;
  const currentKey = typeof current === "string" ? current : null;
  const next = moveSelectableKey(currentKey, delta, keys, disabled);
  return next === null ? null : String(next);
}

function readUrlTab(param: string): string | null {
  const win = safeWindow();
  if (!win) {
    return null;
  }
  return new URLSearchParams(win.location.search).get(param);
}

function writeUrlTab(param: string, tabId: string): void {
  const win = safeWindow();
  if (!win) {
    return;
  }
  const url = new URL(win.location.href);
  url.searchParams.set(param, tabId);
  win.history.replaceState({}, "", url);
}

function createGroup(options: TabsGroupOptions = {}): TabsGroup {
  return {
    activeTabId: options.defaultTab ?? null,
    orientation: options.orientation ?? "horizontal",
    activation: options.activation ?? "automatic",
    urlParam: options.urlParam,
    items: [],
    onChange: options.onChange,
  };
}

function focusTab(
  group: TabsGroup,
  tabId: string,
  groupId: string,
  selection: SelectionController,
  select: (group: TabsGroup, groupId: string, tabId: string) => void
): void {
  if (group.activation === "automatic") {
    select(group, groupId, tabId);
    return;
  }
  selection.setActive(groupId, tabId);
  group.activeTabId = tabId;
}

function focusRelativeTab(
  group: TabsGroup,
  delta: number,
  event: KeyboardEvent,
  groupId: string,
  selection: SelectionController,
  select: (group: TabsGroup, groupId: string, tabId: string) => void
): void {
  event.preventDefault();
  const tabId = moveTab(group, delta, selection, groupId);
  if (tabId) {
    focusTab(group, tabId, groupId, selection, select);
  }
}

function focusEdgeTab(
  group: TabsGroup,
  edge: "start" | "end",
  event: KeyboardEvent,
  groupId: string,
  selection: SelectionController,
  select: (group: TabsGroup, groupId: string, tabId: string) => void
): void {
  event.preventDefault();
  const keys = group.items.map((item) => item.id);
  const disabled = group.items.filter((item) => item.disabled).map((item) => item.id);
  const tabId =
    edge === "start" ? firstSelectableKey(keys, disabled) : lastSelectableKey(keys, disabled);
  if (tabId !== null) {
    focusTab(group, String(tabId), groupId, selection, select);
  }
}

function handleTabsKeydown(
  group: TabsGroup,
  event: KeyboardEvent,
  groupId: string,
  selection: SelectionController,
  select: (group: TabsGroup, groupId: string, tabId: string) => void
): void {
  const horizontal = group.orientation === "horizontal";
  const vertical = group.orientation === "vertical";

  if (event.key === "ArrowRight" && horizontal) {
    focusRelativeTab(group, 1, event, groupId, selection, select);
    return;
  }
  if (event.key === "ArrowLeft" && horizontal) {
    focusRelativeTab(group, -1, event, groupId, selection, select);
    return;
  }
  if (event.key === "ArrowDown" && vertical) {
    focusRelativeTab(group, 1, event, groupId, selection, select);
    return;
  }
  if (event.key === "ArrowUp" && vertical) {
    focusRelativeTab(group, -1, event, groupId, selection, select);
    return;
  }
  if (event.key === "Home") {
    focusEdgeTab(group, "start", event, groupId, selection, select);
    return;
  }
  if (event.key === "End") {
    focusEdgeTab(group, "end", event, groupId, selection, select);
  }
}

/**
 * Headless tabs controller. Manages multiple tab groups with
 * selection, keyboard navigation, URL sync, and ARIA props.
 */
export class TabsController extends BaseController<TabsEvents> {
  #groups: Record<string, TabsGroup> = {};
  readonly #selection = new SelectionController();

  constructor(id?: string) {
    super(id ?? generateId("tabs"));
  }

  get groups(): Readonly<Record<string, TabsGroup>> {
    return this.#groups;
  }

  register(groupId: string, options: TabsGroupOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }
    const group = createGroup(options);
    const defaultTab = options.urlParam
      ? (readUrlTab(options.urlParam) ?? options.defaultTab ?? null)
      : (options.defaultTab ?? null);
    this.#selection.create(groupId, {
      mode: "single",
      defaultValue: defaultTab,
      keys: [],
    });
    group.activeTabId = typeof defaultTab === "string" ? defaultTab : null;
    this.#groups[groupId] = group;
  }

  unregister(groupId: string): void {
    if (this.isDestroyed) {
      return;
    }
    this.#selection.destroy(groupId);
    delete this.#groups[groupId];
  }

  registerTab(groupId: string, tabId: string, disabled = false): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#getOrCreate(groupId);
    const existing = group.items.find((item) => item.id === tabId);
    if (existing) {
      existing.disabled = disabled;
    } else {
      group.items.push({ id: tabId, disabled });
    }

    this.#syncSelection(groupId);
    const snapshot = this.#selection.getSnapshot(groupId);
    if (!(snapshot.value || disabled)) {
      this.#selection.replace(groupId, tabId);
      group.activeTabId = tabId;
    }
  }

  unregisterTab(groupId: string, tabId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[groupId];
    if (!group) {
      return;
    }

    group.items = group.items.filter((item) => item.id !== tabId);
    this.#syncSelection(groupId);
    const active = this.active(groupId);
    group.activeTabId = active;
  }

  select(groupId: string, tabId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[groupId];
    if (!group) {
      return;
    }
    this.#selectInternal(group, groupId, tabId);
  }

  active(groupId: string): string | null {
    const value = this.#selection.getSnapshot(groupId).value;
    return typeof value === "string" || typeof value === "number" ? String(value) : null;
  }

  isActive(groupId: string, tabId: string): boolean {
    const group = this.#groups[groupId];
    if (group?.activation === "manual") {
      const snapshot = this.#selection.getSnapshot(groupId);
      const focused = snapshot.activeKey ?? snapshot.value;
      return focused === tabId;
    }
    return this.#selection.isSelected(groupId, tabId);
  }

  next(groupId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[groupId];
    if (!group) {
      return;
    }
    const nextTab = moveTab(group, 1, this.#selection, groupId);
    if (nextTab) {
      this.#selectInternal(group, groupId, nextTab);
    }
  }

  previous(groupId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[groupId];
    if (!group) {
      return;
    }
    const prevTab = moveTab(group, -1, this.#selection, groupId);
    if (prevTab) {
      this.#selectInternal(group, groupId, prevTab);
    }
  }

  handleKeydown(groupId: string, event: KeyboardEvent): void {
    const group = this.#groups[groupId];
    if (group) {
      handleTabsKeydown(group, event, groupId, this.#selection, (g, id, tabId) =>
        this.#selectInternal(g, id, tabId)
      );
    }
  }

  tabProps(groupId: string, tabId: string): Record<string, string | number | boolean | undefined> {
    const active = this.isActive(groupId, tabId);
    return {
      role: "tab",
      id: `${groupId}-tab-${tabId}`,
      "aria-selected": active,
      "aria-controls": `${groupId}-panel-${tabId}`,
      tabindex: active ? 0 : -1,
    };
  }

  panelProps(groupId: string, tabId: string): Record<string, string | boolean | undefined> {
    const active = this.isActive(groupId, tabId);
    return {
      role: "tabpanel",
      id: `${groupId}-panel-${tabId}`,
      "aria-labelledby": `${groupId}-tab-${tabId}`,
      hidden: !active,
    };
  }

  tablistProps(groupId: string): Record<string, string | undefined> {
    const group = this.#groups[groupId];
    return {
      role: "tablist",
      "aria-orientation": group?.orientation,
    };
  }

  toStore(): TabsStore {
    return {
      groups: this.#groups,
      register: (id, opts) => this.register(id, opts),
      unregister: (id) => this.unregister(id),
      registerTab: (id, tabId, disabled) => this.registerTab(id, tabId, disabled),
      unregisterTab: (id, tabId) => this.unregisterTab(id, tabId),
      select: (id, tabId) => this.select(id, tabId),
      active: (id) => this.active(id),
      isActive: (id, tabId) => this.isActive(id, tabId),
      next: (id) => this.next(id),
      previous: (id) => this.previous(id),
      handleKeydown: (id, event) => this.handleKeydown(id, event),
      tabProps: (id, tabId) => this.tabProps(id, tabId),
      panelProps: (id, tabId) => this.panelProps(id, tabId),
      tablistProps: (id) => this.tablistProps(id),
      destroy: () => this.destroy(),
    };
  }

  #getOrCreate(groupId: string): TabsGroup {
    this.#groups[groupId] ??= createGroup();
    return this.#groups[groupId];
  }

  #selectInternal(group: TabsGroup, groupId: string, tabId: string): void {
    const tab = group.items.find((item) => item.id === tabId);
    if (!tab || tab.disabled) {
      return;
    }

    this.#selection.replace(groupId, tabId);
    this.#selection.setActive(groupId, tabId);
    group.activeTabId = tabId;
    if (group.urlParam) {
      writeUrlTab(group.urlParam, tabId);
    }

    this.emit("change", {
      groupId,
      activeTabId: tabId,
      source: "user",
    });

    group.onChange?.(tabId);
  }

  #syncSelection(groupId: string): void {
    const group = this.#groups[groupId];
    if (!group) {
      return;
    }
    const keys = group.items.map((item) => item.id);
    const disabled = group.items.filter((item) => item.disabled).map((item) => item.id);
    this.#selection.setKeys(groupId, keys);
    this.#selection.setDisabledKeys(groupId, disabled);

    if (group.urlParam) {
      const fromUrl = readUrlTab(group.urlParam);
      if (fromUrl && keys.includes(fromUrl) && !disabled.includes(fromUrl)) {
        this.#selection.replace(groupId, fromUrl);
        group.activeTabId = fromUrl;
        return;
      }
    }
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    this.#selection.destroy();
    super.destroy();
  }
}

/** Creates a TabsController. */
export function createTabsController(id?: string): TabsController {
  return new TabsController(id);
}

/** Creates a TabsStore (backward-compatible). */
export function createTabsStore(): TabsStore {
  return new TabsController().toStore();
}
