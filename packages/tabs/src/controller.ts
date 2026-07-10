export type TabsOrientation = "horizontal" | "vertical";

export type TabItem = {
  id: string;
  disabled: boolean;
};

export type TabsGroupOptions = {
  orientation?: TabsOrientation;
  activation?: "automatic" | "manual";
  urlParam?: string;
  defaultTab?: string;
  onChange?: (tabId: string) => void;
};

export type TabsGroup = {
  activeTabId: string | null;
  orientation: TabsOrientation;
  activation: "automatic" | "manual";
  urlParam?: string;
  items: TabItem[];
  onChange?: (tabId: string) => void;
};

export type TabsStore = {
  /** Reactive registry of tab groups. */
  groups: Record<string, TabsGroup>;
  register(groupId: string, options?: TabsGroupOptions): void;
  unregister(groupId: string): void;
  registerTab(groupId: string, tabId: string, disabled?: boolean): void;
  unregisterTab(groupId: string, tabId: string): void;
  select(groupId: string, tabId: string): void;
  active(groupId: string): string | null;
  isActive(groupId: string, tabId: string): boolean;
  next(groupId: string): void;
  previous(groupId: string): void;
  handleKeydown(groupId: string, event: KeyboardEvent): void;
  tabProps(groupId: string, tabId: string): Record<string, string | number | boolean | undefined>;
  panelProps(groupId: string, tabId: string): Record<string, string | boolean | undefined>;
  tablistProps(groupId: string): Record<string, string | undefined>;
  destroy(): void;
};

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
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get(param);
}

function writeUrlTab(param: string, tabId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(param, tabId);
  window.history.replaceState({}, "", url);
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

/** Creates the headless tabs controller. */
export function createTabsStore(): TabsStore {
  function getOrCreate(store: TabsStore, groupId: string): TabsGroup {
    store.groups[groupId] ??= createGroup();
    return store.groups[groupId];
  }

  function selectInternal(group: TabsGroup, tabId: string): void {
    const tab = group.items.find((item) => item.id === tabId);
    if (!tab || tab.disabled) {
      return;
    }

    group.activeTabId = tabId;
    if (group.urlParam) {
      writeUrlTab(group.urlParam, tabId);
    }
    group.onChange?.(tabId);
  }

  const store: TabsStore = {
    groups: {},

    register(groupId, options = {}) {
      const group = createGroup(options);
      if (options.urlParam) {
        const fromUrl = readUrlTab(options.urlParam);
        if (fromUrl) {
          group.activeTabId = fromUrl;
        }
      }
      this.groups[groupId] = group;
    },

    unregister(groupId) {
      delete this.groups[groupId];
    },

    registerTab(groupId, tabId, disabled = false) {
      const group = getOrCreate(this, groupId);
      const existing = group.items.find((item) => item.id === tabId);
      if (existing) {
        existing.disabled = disabled;
      } else {
        group.items.push({ id: tabId, disabled });
      }

      if (!(group.activeTabId || disabled)) {
        group.activeTabId = tabId;
      }
    },

    unregisterTab(groupId, tabId) {
      const group = this.groups[groupId];
      if (!group) {
        return;
      }

      group.items = group.items.filter((item) => item.id !== tabId);
      if (group.activeTabId === tabId) {
        group.activeTabId = enabledTabs(group)[0]?.id ?? null;
      }
    },

    select(groupId, tabId) {
      const group = this.groups[groupId];
      if (!group) {
        return;
      }
      selectInternal(group, tabId);
    },

    active(groupId) {
      return this.groups[groupId]?.activeTabId ?? null;
    },

    isActive(groupId, tabId) {
      return this.groups[groupId]?.activeTabId === tabId;
    },

    next(groupId) {
      const group = this.groups[groupId];
      if (!group) {
        return;
      }

      const nextTab = moveTab(group, 1);
      if (nextTab) {
        selectInternal(group, nextTab);
      }
    },

    previous(groupId) {
      const group = this.groups[groupId];
      if (!group) {
        return;
      }

      const prevTab = moveTab(group, -1);
      if (prevTab) {
        selectInternal(group, prevTab);
      }
    },

    handleKeydown(groupId, event) {
      const group = this.groups[groupId];
      if (group) {
        handleTabsKeydown(group, event, selectInternal);
      }
    },

    tabProps(groupId, tabId) {
      const active = this.isActive(groupId, tabId);
      return {
        role: "tab",
        id: `${groupId}-tab-${tabId}`,
        "aria-selected": active,
        "aria-controls": `${groupId}-panel-${tabId}`,
        tabindex: active ? 0 : -1,
      };
    },

    panelProps(groupId, tabId) {
      const active = this.isActive(groupId, tabId);
      return {
        role: "tabpanel",
        id: `${groupId}-panel-${tabId}`,
        "aria-labelledby": `${groupId}-tab-${tabId}`,
        hidden: !active,
      };
    },

    tablistProps(groupId) {
      const group = this.groups[groupId];
      return {
        role: "tablist",
        "aria-orientation": group?.orientation,
      };
    },

    destroy() {
      this.groups = {};
    },
  };

  return store;
}

export type TabsController = TabsStore;

/** Alias matching the controller-based architecture naming. */
export function createTabsController(): TabsController {
  return createTabsStore();
}
