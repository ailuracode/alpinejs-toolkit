/**
 * Measurement cache and layout math for virtual lists.
 */

import type { NormalizedVirtualOptions } from "../options.js";
import type { VirtualItem, VirtualKey } from "../types.js";
import {
  findFirstVisibleIndex,
  findLastVisibleIndex,
  findNearestItemIndex,
} from "./binary-search.js";

export type ItemMeasurement = {
  readonly index: number;
  readonly key: VirtualKey;
  readonly start: number;
  readonly end: number;
  readonly size: number;
};

export type MeasurementState = {
  measurements: ItemMeasurement[];
  totalSize: number;
};

function itemSizeAt(
  sizeByKey: Map<VirtualKey, number>,
  key: VirtualKey,
  estimateSize: number
): number {
  return sizeByKey.get(key) ?? estimateSize;
}

/** Rebuilds prefix-sum measurements from keys and measured sizes. */
export function buildMeasurements(
  options: NormalizedVirtualOptions,
  keys: readonly VirtualKey[],
  sizeByKey: ReadonlyMap<VirtualKey, number>
): MeasurementState {
  const count = options.count;
  const measurements: ItemMeasurement[] = [];
  let offset = options.paddingStart;

  for (let index = 0; index < count; index++) {
    const key = keys[index] ?? options.getItemKey(index);
    const size = itemSizeAt(sizeByKey as Map<VirtualKey, number>, key, options.estimateSize);
    const start = offset;
    const end = start + size;

    measurements.push({ index, key, start, end, size });
    offset = end + (index < count - 1 ? options.gap : 0);
  }

  const totalSize = offset + options.paddingEnd;
  return { measurements, totalSize };
}

export type VisibleRange = {
  startIndex: number;
  endIndex: number;
};

/** Calculates the visible index range for the current scroll offset. */
export function calculateVisibleRange(
  measurements: readonly ItemMeasurement[],
  scrollOffset: number,
  viewportSize: number,
  overscan: number
): VisibleRange {
  if (measurements.length === 0) {
    return { startIndex: 0, endIndex: -1 };
  }

  const viewportStart = scrollOffset;
  const viewportEnd = scrollOffset + viewportSize;

  const getStart = (index: number): number => measurements[index]?.start ?? 0;
  const getEnd = (index: number): number => measurements[index]?.end ?? 0;

  const firstVisible = findFirstVisibleIndex(measurements.length, getEnd, viewportStart);
  const lastVisible = findLastVisibleIndex(measurements.length, getStart, viewportEnd);

  const startIndex = Math.max(0, firstVisible - overscan);
  const endIndex = Math.min(measurements.length - 1, lastVisible + overscan);

  return { startIndex, endIndex };
}

/** Returns virtual items for the visible range. */
export function sliceVirtualItems(
  measurements: readonly ItemMeasurement[],
  range: VisibleRange
): VirtualItem[] {
  if (range.endIndex < range.startIndex || measurements.length === 0) {
    return [];
  }

  const items: VirtualItem[] = [];
  for (let index = range.startIndex; index <= range.endIndex; index++) {
    const measurement = measurements[index];
    if (measurement) {
      items.push({
        key: measurement.key,
        index: measurement.index,
        start: measurement.start,
        end: measurement.end,
        size: measurement.size,
      });
    }
  }
  return items;
}

export type ScrollOffsetResult = {
  offset: number;
  align: "start" | "center" | "end";
};

/** Resolves scroll offset for an index with alignment. */
export function getOffsetForIndex(
  measurements: readonly ItemMeasurement[],
  index: number,
  align: "start" | "center" | "end" | "auto",
  viewportSize: number,
  scrollMargin: number
): ScrollOffsetResult | undefined {
  const measurement = measurements[index];
  if (!measurement) {
    return undefined;
  }

  const size = measurement.size;
  let resolvedAlign: "start" | "center" | "end" = align === "auto" ? "start" : align;

  if (align === "auto") {
    const itemStart = measurement.start - scrollMargin;
    const itemEnd = measurement.end + scrollMargin;

    const lastMeasurement = measurements[measurements.length - 1];
    if (itemStart < 0) {
      resolvedAlign = "start";
    } else if (lastMeasurement && itemEnd > lastMeasurement.end) {
      resolvedAlign = "end";
    } else {
      resolvedAlign = "start";
    }
  }

  let offset = measurement.start - scrollMargin;

  if (resolvedAlign === "center") {
    offset = measurement.start - (viewportSize - size) / 2;
  } else if (resolvedAlign === "end") {
    offset = measurement.end - viewportSize + scrollMargin;
  }

  return { offset, align: resolvedAlign };
}

/** Finds scroll offset for a target offset using measurements. */
export function clampScrollOffset(offset: number, totalSize: number, viewportSize: number): number {
  const maxOffset = Math.max(0, totalSize - viewportSize);
  return Math.min(Math.max(0, offset), maxOffset);
}

/** Finds index nearest to a scroll offset. */
export function indexAtOffset(measurements: readonly ItemMeasurement[], offset: number): number {
  if (measurements.length === 0) {
    return 0;
  }

  const getStart = (index: number): number => measurements[index]?.start ?? 0;
  return findNearestItemIndex(measurements.length, getStart, offset);
}

/** Adjusts scroll offset when item sizes change to preserve visible anchor. */
export function adjustScrollOffsetForResize(
  previousMeasurements: readonly ItemMeasurement[],
  nextMeasurements: readonly ItemMeasurement[],
  previousOffset: number,
  anchorIndex: number
): number {
  const previousAnchor = previousMeasurements[anchorIndex];
  const nextAnchor = nextMeasurements[anchorIndex];

  if (!(previousAnchor && nextAnchor)) {
    return previousOffset;
  }

  const delta = nextAnchor.start - previousAnchor.start;
  return Math.max(0, previousOffset + delta);
}
