/**
 * Public type contracts for `@ailuracode/alpine-tabs`.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** Tab list orientation. */
export type TabsOrientation = "horizontal" | "vertical";

/** A tab's registration state. */
export type TabItem = {
  id: string;
  disabled: boolean;
};

/** Options passed when registering a tab group. */
export type TabsGroupOptions = {
  readonly orientation?: TabsOrientation;
  readonly activation?: "automatic" | "manual";
  readonly urlParam?: string;
  readonly defaultTab?: string;
  readonly onChange?: (tabId: string) => void;
};

/** Internal representation of a tab group. */
export type TabsGroup = {
  activeTabId: string | null;
  orientation: TabsOrientation;
  activation: "automatic" | "manual";
  urlParam?: string;
  items: TabItem[];
  onChange?: (tabId: string) => void;
};

/** Discriminator for change events. */
export type TabsChangeSource = "user" | "initialization";

/** Detail payload for the `change` event. */
export interface TabsChangeDetail {
  readonly groupId: string;
  readonly activeTabId: string | null;
  readonly source: TabsChangeSource;
}

/** Alpine-facing store surface. */
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

/** Options accepted by the tabs plugin factory. */
export interface CreateTabsOptions {
  readonly id?: string;
}

/** Typed view of `Alpine` the tabs plugin uses internally. */
export type TabsAlpine = Alpine<{ tabs: TabsStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type TabsPluginCallback = PluginCallback<AlpineBase>;
