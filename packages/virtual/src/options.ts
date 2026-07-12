/**
 * Options normalization for `@ailuracode/alpine-virtual`.
 */

import type { VirtualOptions } from "./types.js";

export type NormalizedVirtualOptions = {
  readonly count: number;
  readonly horizontal: boolean;
  readonly estimateSize: number;
  readonly overscan: number;
  readonly paddingStart: number;
  readonly paddingEnd: number;
  readonly scrollMargin: number;
  readonly gap: number;
  readonly scrollMode: "element" | "window";
  readonly getItemKey: (index: number) => string | number;
  readonly onChange?: () => void;
};

const defaultGetItemKey = (index: number): number => index;

/** Normalizes consumer options once at the instance boundary. */
export function normalizeVirtualOptions(options: VirtualOptions = {}): NormalizedVirtualOptions {
  const count = options.count ?? 0;
  if (count < 0) {
    throw new RangeError(`virtual count must be >= 0, received ${count}`);
  }

  const estimateSize = options.estimateSize ?? 50;
  if (estimateSize <= 0) {
    throw new RangeError(`virtual estimateSize must be > 0, received ${estimateSize}`);
  }

  const overscan = options.overscan ?? 1;
  if (overscan < 0) {
    throw new RangeError(`virtual overscan must be >= 0, received ${overscan}`);
  }

  return {
    count,
    horizontal: options.horizontal ?? false,
    estimateSize,
    overscan,
    paddingStart: options.paddingStart ?? 0,
    paddingEnd: options.paddingEnd ?? 0,
    scrollMargin: options.scrollMargin ?? 0,
    gap: options.gap ?? 0,
    scrollMode: options.scrollMode ?? "element",
    getItemKey: options.getItemKey ?? defaultGetItemKey,
    onChange: options.onChange,
  };
}
