/**
 * Typed event surface for `@ailuracode/alpine-selection`.
 */

import type { SelectionInstance, SelectionKey, SelectionMode, SelectionValue } from "./types.js";

/** Emitted after a confirmed selection transition. */
export type SelectionChangeDetail = {
  readonly id: string;
  readonly mode: SelectionMode;
  readonly value: SelectionValue;
  readonly previous: SelectionValue;
  readonly anchorKey: SelectionKey | null;
  readonly activeKey: SelectionKey | null;
  readonly selectedKeys: readonly SelectionKey[];
  readonly snapshot: SelectionInstance;
};

export type SelectionEvents = {
  change: SelectionChangeDetail;
};
