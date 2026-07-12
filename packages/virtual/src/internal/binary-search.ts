/**
 * Binary search helpers for virtual list offset lookups.
 */

/** Finds the largest index whose start offset is <= target. */
export function findNearestItemIndex(
  itemCount: number,
  getStart: (index: number) => number,
  target: number
): number {
  if (itemCount === 0) {
    return 0;
  }

  let low = 0;
  let high = itemCount - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const start = getStart(mid);

    if (start === target) {
      return mid;
    }

    if (start < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.max(0, high);
}

/** Finds the smallest index whose end offset is >= target. */
export function findFirstVisibleIndex(
  itemCount: number,
  getEnd: (index: number) => number,
  viewportStart: number
): number {
  if (itemCount === 0) {
    return 0;
  }

  let low = 0;
  let high = itemCount - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const end = getEnd(mid);

    if (end < viewportStart) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

/** Finds the largest index whose start offset is < viewportEnd. */
export function findLastVisibleIndex(
  itemCount: number,
  getStart: (index: number) => number,
  viewportEnd: number
): number {
  if (itemCount === 0) {
    return 0;
  }

  let low = 0;
  let high = itemCount - 1;

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const start = getStart(mid);

    if (start >= viewportEnd) {
      high = mid - 1;
    } else {
      low = mid;
    }
  }

  return low;
}
