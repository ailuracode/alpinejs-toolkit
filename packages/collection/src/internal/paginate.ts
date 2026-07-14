/**
 * Internal — pagination stage.
 *
 * Slices the post-filter, post-sort view (NOT the source). The slice window
 * is recomputed only when the page size or the view itself changes. `page`
 * is always clamped to the valid range.
 */

import type { CollectionKey, CollectionViewItem } from "../types.js";

export function computePageCount(total: number, pageSize: number): number {
  if (pageSize < 1) {
    return 1;
  }
  if (total <= 0) {
    return 1;
  }
  return Math.max(1, Math.ceil(total / pageSize));
}

export function paginate<T, K extends CollectionKey>(
  view: readonly CollectionViewItem<T, K>[],
  page: number,
  pageSize: number
): CollectionViewItem<T, K>[] {
  const count = view.length;
  const pageCount = computePageCount(count, pageSize);
  const safePage = clampPage(page, pageCount);
  if (count === 0) {
    return [];
  }
  const start = (safePage - 1) * pageSize;
  const end = Math.min(start + pageSize, count);
  return view.slice(start, end);
}

function clampPage(page: number, pageCount: number): number {
  if (pageCount < 1) {
    return 1;
  }
  if (page < 1) {
    return 1;
  }
  if (page > pageCount) {
    return pageCount;
  }
  return page;
}
