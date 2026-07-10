/**
 * Tabs controller — the framework-agnostic core of
 * `@ailuracode/alpine-tabs`. Manages tab groups with selection,
 * keyboard navigation, URL sync, and ARIA props.
 *
 * Emits a typed `change` event on every selection so consumers
 * can react programmatically.
 */

import { BaseController, generateId, safeWindow } from "@ailuracode/alpine-core";
import type { TabsEvents } from "./events";
import type { TabItem, TabsGroup, TabsGroupOptions, TabsStore } from "./types";

function enabledTabs(group: TabsGroup): TabItem[] {
  return group.items.filter((item) => !item.disabled);
}

function tabIndex(group: TabsGroup, tabId: string): number {
  return enabledTabs(group).findIndex((item) => item.id === tabId);
}

function moveTab(group: TabsGroup, delta: number): string | null {
  const items = enabledTabs(group);
  if (items.length === 0) {
    return null;
  }

  const current = group.activeTabId ? tabIndex(group, group.activeTabId) : 0;
  const next = (current + delta + items.length) % items.length;
  return items[next]?.id ?? null;
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
  select: (group: TabsGroup, tabId: string) => void
): void {
  if (group.activation === "automatic") {
    select(group, tabId);
    return;
  }
  group.activeTabId = tabId;
}

function focusRelativeTab(
  group: TabsGroup,
  delta: number,
  event: KeyboardEvent,
  select: (group: TabsGroup, tabId: string) => void
): void {
  event.preventDefault();
  const tabId = moveTab(group, delta);
  if (tabId) {
    focusTab(group, tabId, select);
  }
}

function focusEdgeTab(
  group: TabsGroup,
  edge: "start" | "end",
  event: KeyboardEvent,
  select: (group: TabsGroup, tabId: string) => void
): void {
  event.preventDefault();
  const items = enabledTabs(group);
  const tabId = edge === "start" ? items[0]?.id : items[items.length - 1]?.id;
  if (tabId) {
    focusTab(group, tabId, select);
  }
}

function handleTabsKeydown(
  group: TabsGroup,
  event: KeyboardEvent,
  select: (group: TabsGroup, tabId: string) => void
): void {
  const horizontal = group.orientation === "horizontal";
  const vertical = group.orientation === "vertical";

  if (event.key === "ArrowRight" && horizontal) {
    focusRelativeTab(group, 1, event, select);
    return;
  }
  if (event.key === "ArrowLeft" && horizontal) {
    focusRelativeTab(group, -1, event, select);
    return;
  }
  if (event.key === "ArrowDown" && vertical) {
    focusRelativeTab(group, 1, event, select);
    return;
  }
  if (event.key === "ArrowUp" && vertical) {
    focusRelativeTab(group, -1, event, select);
    return;
  }
  if (event.key === "Home") {
    focusEdgeTab(group, "start", event, select);
    return;
  }
  if (event.key === "End") {
    focusEdgeTab(group, "end", event, select);
  }
}

/**
 * Headless tabs controller. Manages multiple tab groups with
 * selection, keyboard navigation, URL sync, and ARIA props.
 */
export class TabsController extends BaseController<TabsEvents> {
  #groups: Record<string, TabsGroup> = {};

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
    if (options.urlParam) {
      const fromUrl = readUrlTab(options.urlParam);
      if (fromUrl) {
        group.activeTabId = fromUrl;
      }
    }
    this.#groups[groupId] = group;
  }

  unregister(groupId: string): void {
    if (this.isDestroyed) {
      return;
    }
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

    if (!(group.activeTabId || disabled)) {
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
    if (group.activeTabId === tabId) {
      group.activeTabId = enabledTabs(group)[0]?.id ?? null;
    }
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
    return this.#groups[groupId]?.activeTabId ?? null;
  }

  isActive(groupId: string, tabId: string): boolean {
    return this.#groups[groupId]?.activeTabId === tabId;
  }

  next(groupId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[groupId];
    if (!group) {
      return;
    }
    const nextTab = moveTab(group, 1);
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
    const prevTab = moveTab(group, -1);
    if (prevTab) {
      this.#selectInternal(group, groupId, prevTab);
    }
  }

  handleKeydown(groupId: string, event: KeyboardEvent): void {
    const group = this.#groups[groupId];
    if (group) {
      handleTabsKeydown(group, event, (g, tabId) => this.#selectInternal(g, groupId, tabId));
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
}

/** Creates a TabsController. */
export function createTabsController(id?: string): TabsController {
  return new TabsController(id);
}

/** Creates a TabsStore (backward-compatible). */
export function createTabsStore(): TabsStore {
  return new TabsController().toStore();
}
