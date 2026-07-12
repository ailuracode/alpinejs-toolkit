/**
 * Typed event surface for `@ailuracode/alpine-virtual`.
 */

import type { VirtualItem, VirtualScrollDirection } from "./types.js";

/** Emitted when any instance snapshot changes. */
export type VirtualChangeDetail = {
  readonly id: string;
};

/** Emitted when the visible range changes. */
export type VirtualRangeChangeDetail = {
  readonly id: string;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly virtualItems: readonly VirtualItem[];
};

/** Emitted on scroll offset updates. */
export type VirtualScrollDetail = {
  readonly id: string;
  readonly scrollOffset: number;
  readonly scrollDirection: VirtualScrollDirection;
  readonly isScrolling: boolean;
};

export type VirtualEvents = {
  change: VirtualChangeDetail;
  rangeChange: VirtualRangeChangeDetail;
  scroll: VirtualScrollDetail;
};
