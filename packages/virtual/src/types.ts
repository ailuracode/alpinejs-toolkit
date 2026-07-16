/**
 * Public type contracts for `@ailuracode/alpine-virtual`.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core/types";
import type { Alpine as AlpineBase } from "alpinejs";

/** Stable identity for a virtualized row. */
export type VirtualKey = string | number;

/** Scroll alignment when programmatically scrolling to an index. */
export type VirtualScrollAlign = "start" | "center" | "end" | "auto";

/** Scroll behavior for programmatic scroll commands. */
export type VirtualScrollBehavior = "auto" | "smooth";

/** Scroll container mode. */
export type VirtualScrollMode = "element" | "window";

/** Direction of the last scroll movement. */
export type VirtualScrollDirection = "forward" | "backward" | "none";

/** A single virtualized item with layout offsets. */
export type VirtualItem = {
  readonly key: VirtualKey;
  readonly index: number;
  readonly start: number;
  readonly end: number;
  readonly size: number;
};

/** Options passed when creating a virtual list instance. */
export type VirtualOptions = {
  readonly count?: number;
  readonly horizontal?: boolean;
  readonly estimateSize?: number;
  readonly overscan?: number;
  readonly paddingStart?: number;
  readonly paddingEnd?: number;
  readonly scrollMargin?: number;
  readonly gap?: number;
  readonly scrollMode?: VirtualScrollMode;
  readonly getItemKey?: (index: number) => VirtualKey;
  readonly onChange?: () => void;
};

/** Readonly snapshot of virtual list state. */
export type VirtualInstance = {
  readonly count: number;
  readonly scrollOffset: number;
  readonly scrollDirection: VirtualScrollDirection;
  readonly isScrolling: boolean;
  readonly totalSize: number;
  readonly viewportSize: number;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly virtualItems: readonly VirtualItem[];
  readonly options: VirtualOptions;
};

/** Options for scroll-to-index commands. */
export type VirtualScrollToIndexOptions = {
  readonly align?: VirtualScrollAlign;
  readonly behavior?: VirtualScrollBehavior;
};

/** Alpine-facing store surface. */
export type VirtualStore = {
  readonly instances: Record<string, VirtualInstance>;
  create(id: string, options?: VirtualOptions): void;
  destroy(id: string): void;
  destroyAll(): void;
  bindScrollElement(id: string, element: HTMLElement | null): void;
  setCount(id: string, count: number): void;
  setKeys(id: string, keys: readonly VirtualKey[]): void;
  measureItem(id: string, index: number, size: number): void;
  scrollToIndex(id: string, index: number, options?: VirtualScrollToIndexOptions): void;
  scrollToOffset(
    id: string,
    offset: number,
    options?: Pick<VirtualScrollToIndexOptions, "behavior">
  ): void;
  getVirtualItems(id: string): readonly VirtualItem[];
  getTotalSize(id: string): number;
  listProps(
    id: string,
    options?: { label?: string }
  ): Record<string, string | number | boolean | undefined>;
  itemProps(id: string, index: number): Record<string, string | number | boolean | undefined>;
  contentProps(id: string): Record<string, string | number | undefined>;
};

/** Options accepted by the virtual plugin factory. */
export interface CreateVirtualOptions {
  readonly id?: string;
  /**
   * `$store.virtual` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_VIRTUAL_STORE_KEY}. Set when the host
   * already owns a `virtual` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the controller.
   */
  readonly storeKey?: string;
}

/** Default `$store.virtual` key registered by {@link virtualPlugin}. */
export const DEFAULT_VIRTUAL_STORE_KEY = "virtual";

/** Typed view of `Alpine` the virtual plugin uses internally. */
export type VirtualAlpine = Alpine<{ virtual: VirtualStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type VirtualPluginCallback = PluginCallback<AlpineBase>;
