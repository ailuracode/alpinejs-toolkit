/**
 * Typed event surface for `@ailuracode/alpine-history`.
 */

import type { HistoryChangeSource, HistoryEntry } from "./types.js";

/** Detail payload emitted after every history state transition. */
export type HistoryChangeDetail<T, TMeta = unknown> = {
  readonly source: HistoryChangeSource;
  readonly value: T | undefined;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undoStack: readonly HistoryEntry<T, TMeta>[];
  readonly redoStack: readonly HistoryEntry<T, TMeta>[];
  readonly transactionDepth: number;
};

/** Snapshot of stacks saved at transaction start for rollback. */
export type HistoryTransactionSnapshot<T, TMeta = unknown> = {
  readonly undoStack: readonly HistoryEntry<T, TMeta>[];
  readonly value: T | undefined;
};

/** Event map consumed by `BaseController<HistoryEvents>`. */
export interface HistoryEvents<T = unknown, TMeta = unknown> extends Record<string, unknown> {
  change: HistoryChangeDetail<T, TMeta>;
}
