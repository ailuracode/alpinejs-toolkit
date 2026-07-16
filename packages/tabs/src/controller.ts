/**
 * Tabs controller — the framework-agnostic core of
 * `@ailuracode/alpine-tabs`. Manages tab groups with selection,
 * keyboard navigation, URL sync, and ARIA props.
 *
 * Emits a typed `change` event on every selection so consumers
 * can react programmatically.
 *
 * Selection state is a plain per-group object — no controller class,
 * no event emission. The full `@ailuracode/alpine-selection`
 * dependency was dropped in favour of this lightweight state to keep
 * the bundle slim.
 */

import { safeWindow } from "@ailuracode/alpine-core/browser";
import { BaseController, generateId } from "@ailuracode/alpine-core/controller";
import type { TabsEvents } from "./events";
import type { TabsGroup, TabsGroupOptions, TabsStore } from "./types";

interface TabsSelectionState {
  value: string | null;
  activeKey: string | null;
  keys: readonly string[];
  disabledKeys: ReadonlySet<string>;
}

function createSelection(defaultValue: string | null): TabsSelectionState {
  return {
    value: defaultValue,
    activeKey: defaultValue,
    keys: [],
    disabledKeys: new Set<string>(),
  };
}

function moveSelectionKey(
  state: TabsSelectionState,
  manual: boolean,
  delta: number
): string | null {
  const keys = state.keys.filter((k) => !state.disabledKeys.has(k));
  if (keys.length === 0) {
    return null;
  }
  const current = manual ? state.activeKey : state.value;
  const idx = current === null ? -1 : keys.indexOf(current);
  const start = idx === -1 ? (delta > 0 ? -1 : 0) : idx;
  return keys[(start + delta + keys.length) % keys.length] ?? null;
}

function readUrlTab(param: string): string | null {
  const win = safeWindow();
  return win ? new URLSearchParams(win.location.search).get(param) : null;
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

/**
 * Headless tabs controller. Manages multiple tab groups with
 * selection, keyboard navigation, URL sync, and ARIA props.
 */
export class TabsController extends BaseController<TabsEvents> {
  #groups: Record<string, TabsGroup> = {};
  #selection: Record<string, TabsSelectionState> = {};

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
    const tabId = typeof defaultTab === "string" ? defaultTab : null;
    this.#selection[groupId] = createSelection(tabId);
    group.activeTabId = tabId;
    this.#groups[groupId] = group;
  }

  unregister(groupId: string): void {
    if (this.isDestroyed) {
      return;
    }
    delete this.#selection[groupId];
    delete this.#groups[groupId];
  }

  registerTab(groupId: string, tabId: string, disabled = false): void {
    if (this.isDestroyed) {
      return;
    }
    if (!this.#groups[groupId]) {
      this.#groups[groupId] = createGroup();
    }
    if (!this.#selection[groupId]) {
      this.#selection[groupId] = createSelection(null);
    }
    const group = this.#groups[groupId];
    const selection = this.#selection[groupId];
    if (!(group && selection)) {
      return;
    }
    const existing = group.items.find((item) => item.id === tabId);
    if (existing) {
      existing.disabled = disabled;
    } else {
      group.items.push({ id: tabId, disabled });
    }
    this.#syncSelection(groupId);
    if (!(selection.value || disabled)) {
      selection.value = tabId;
      selection.activeKey = tabId;
      group.activeTabId = tabId;
    }
  }

  unregisterTab(groupId: string, tabId: string): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[groupId];
    const selection = this.#selection[groupId];
    if (!(group && selection)) {
      return;
    }
    const wasActive = this.active(groupId) === tabId;
    group.items = group.items.filter((item) => item.id !== tabId);
    this.#syncSelection(groupId);
    if (wasActive && group.items.length > 0) {
      const next = group.items.find((item) => !item.disabled);
      if (next) {
        selection.value = next.id;
        selection.activeKey = next.id;
        group.activeTabId = next.id;
        return;
      }
    }
    if (wasActive && group.items.length === 0) {
      selection.value = null;
      group.activeTabId = null;
      return;
    }
    group.activeTabId = this.active(groupId);
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
    const group = this.#groups[groupId];
    const selection = this.#selection[groupId];
    if (!selection) {
      return null;
    }
    return group?.activation === "manual"
      ? (selection.activeKey ?? selection.value)
      : selection.value;
  }

  isActive(groupId: string, tabId: string): boolean {
    const group = this.#groups[groupId];
    const selection = this.#selection[groupId];
    if (!selection) {
      return false;
    }
    return group?.activation === "manual"
      ? (selection.activeKey ?? selection.value) === tabId
      : selection.value === tabId;
  }

  next(groupId: string): void {
    this.#step(groupId, 1);
  }

  previous(groupId: string): void {
    this.#step(groupId, -1);
  }

  #step(groupId: string, delta: number): void {
    if (this.isDestroyed) {
      return;
    }
    const group = this.#groups[groupId];
    const selection = this.#selection[groupId];
    if (!(group && selection)) {
      return;
    }
    const tabId = moveSelectionKey(selection, group.activation === "manual", delta);
    if (tabId) {
      this.#selectInternal(group, groupId, tabId);
    }
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: keyboard handler must dispatch on key + orientation
  handleKeydown(groupId: string, event: KeyboardEvent): void {
    const group = this.#groups[groupId];
    const selection = this.#selection[groupId];
    if (!(group && selection)) {
      return;
    }
    const horizontal = group.orientation === "horizontal";
    const vertical = group.orientation === "vertical";
    const key = event.key;
    if (key === "ArrowRight" && horizontal) {
      event.preventDefault();
      this.#handleArrow(group, groupId, selection, 1);
      return;
    }
    if (key === "ArrowLeft" && horizontal) {
      event.preventDefault();
      this.#handleArrow(group, groupId, selection, -1);
      return;
    }
    if (key === "ArrowDown" && vertical) {
      event.preventDefault();
      this.#handleArrow(group, groupId, selection, 1);
      return;
    }
    if (key === "ArrowUp" && vertical) {
      event.preventDefault();
      this.#handleArrow(group, groupId, selection, -1);
      return;
    }
    if (key === "Home" || key === "End") {
      event.preventDefault();
      const keys = selection.keys.filter((k) => !selection.disabledKeys.has(k));
      if (keys.length === 0) {
        return;
      }
      const tabId = key === "Home" ? (keys[0] ?? null) : (keys[keys.length - 1] ?? null);
      if (tabId) {
        this.#focusOrSelect(group, groupId, selection, tabId);
      }
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
    return { role: "tablist", "aria-orientation": this.#groups[groupId]?.orientation };
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

  #handleArrow(
    group: TabsGroup,
    groupId: string,
    selection: TabsSelectionState,
    delta: number
  ): void {
    const tabId = moveSelectionKey(selection, group.activation === "manual", delta);
    if (tabId) {
      this.#focusOrSelect(group, groupId, selection, tabId);
    }
  }

  #focusOrSelect(
    group: TabsGroup,
    groupId: string,
    selection: TabsSelectionState,
    tabId: string
  ): void {
    if (group.activation === "manual") {
      selection.activeKey = tabId;
      group.activeTabId = tabId;
      return;
    }
    this.#selectInternal(group, groupId, tabId);
  }

  #selectInternal(group: TabsGroup, groupId: string, tabId: string): void {
    const selection = this.#selection[groupId];
    const tab = group.items.find((item) => item.id === tabId);
    if (!(selection && tab) || tab.disabled) {
      return;
    }
    selection.value = tabId;
    selection.activeKey = tabId;
    group.activeTabId = tabId;
    if (group.urlParam) {
      writeUrlTab(group.urlParam, tabId);
    }
    this.emit("change", { groupId, activeTabId: tabId, source: "user" });
    group.onChange?.(tabId);
  }

  #syncSelection(groupId: string): void {
    const group = this.#groups[groupId];
    const selection = this.#selection[groupId];
    if (!(group && selection)) {
      return;
    }
    const keys = group.items.map((item) => item.id);
    const disabled = group.items.filter((item) => item.disabled).map((item) => item.id);
    selection.keys = keys;
    selection.disabledKeys = new Set(disabled);
    if (selection.value !== null && !keys.includes(selection.value)) {
      selection.value = null;
    }
    if (selection.activeKey !== null && !keys.includes(selection.activeKey)) {
      selection.activeKey = null;
    }
    if (group.urlParam) {
      const fromUrl = readUrlTab(group.urlParam);
      if (fromUrl && keys.includes(fromUrl) && !disabled.includes(fromUrl)) {
        selection.value = fromUrl;
        group.activeTabId = fromUrl;
      }
    }
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
