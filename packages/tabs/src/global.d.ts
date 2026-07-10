/// <reference types="@types/alpinejs" />

import type { TabsGroup, TabsGroupOptions } from "./types";

export type { TabsGroup, TabsGroupOptions, TabsOrientation } from "./types";

export interface TabsStore {
  readonly groups: Record<string, TabsGroup>;
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
}

export function createTabsController(id?: string): import("./types").TabsController;

export default function tabsPlugin(): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      tabs: TabsStore;
    }
    interface Magics<T> {
      $tabs: TabsStore;
    }
  }
}
