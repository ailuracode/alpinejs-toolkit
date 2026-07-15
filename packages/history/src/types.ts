/**
 * Public type contracts for `@ailuracode/alpine-history`.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** Deep clone strategy for history entries. */
export type CloneStrategy<T> = (value: T) => T;

/** Equality strategy to deduplicate consecutive commits. */
export type EqualityStrategy<T> = (a: T, b: T) => boolean;

/** Optional persistence adapter for undo history. */
export interface PersistenceAdapter<T> {
  load(): HistoryEntry<T, unknown>[];
  save(entries: HistoryEntry<T, unknown>[]): void;
  clear(): void;
}

/** Metadata attached to every history entry. */
export type HistoryEntryMeta<TMeta = unknown> = {
  readonly id: string;
  readonly timestamp: number;
  readonly label?: string;
  readonly group?: string;
  readonly estimatedSize?: number;
  readonly meta?: TMeta;
};

/** A single snapshot in the undo/redo stacks. */
export type HistoryEntry<T, TMeta = unknown> = {
  readonly value: T;
  readonly meta: HistoryEntryMeta<TMeta>;
};

/** Discriminates the cause of a history change event. */
export type HistoryChangeSource =
  | "commit"
  | "undo"
  | "redo"
  | "reset"
  | "checkpoint"
  | "clear"
  | "transaction:start"
  | "transaction:commit"
  | "transaction:rollback"
  | "initialization";

/** Nested transaction handling policy. */
export type NestedTransactionPolicy = "merge" | "stack";

/** Options accepted by {@link HistoryController}. */
export type CreateHistoryControllerOptions<T> = {
  readonly id?: string;
  readonly initialValue?: T;
  readonly limit?: number;
  readonly maxSize?: number;
  readonly clone?: CloneStrategy<T>;
  readonly equality?: EqualityStrategy<T>;
  readonly persistence?: PersistenceAdapter<T>;
  readonly nestedTransactionPolicy?: NestedTransactionPolicy;
  readonly debounceMs?: number;
  readonly scope?: unknown;
};

/** Read-only transaction handle returned by `controller.transaction()`. */
export type TransactionHandle<T> = {
  readonly value: T;
  commit(): void;
  rollback(): void;
};

/** Framework-agnostic read/write surface for history state. */
export type HistoryManager<T, TMeta = unknown> = {
  readonly value: T | undefined;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undoStack: readonly HistoryEntry<T, TMeta>[];
  readonly redoStack: readonly HistoryEntry<T, TMeta>[];
  readonly transactionDepth: number;
  readonly limit: number;
  readonly maxSize: number | undefined;
  commit(value: T, meta?: { label?: string; group?: string; meta?: TMeta }): void;
  undo(): T | undefined;
  redo(): T | undefined;
  clear(): void;
  reset(value: T, meta?: { label?: string; group?: string; meta?: TMeta }): void;
  checkpoint(meta?: { label?: string; group?: string; meta?: TMeta }): void;
  transaction(initialValue: T): TransactionHandle<T>;
};

/** Alpine store surface — `value` is mutable for reactivity. */
export type HistoryStore<T, TMeta = unknown> = {
  value: T | undefined;
  canUndo: boolean;
  canRedo: boolean;
  undoStack: readonly HistoryEntry<T, TMeta>[];
  redoStack: readonly HistoryEntry<T, TMeta>[];
  transactionDepth: number;
  commit(value: T, meta?: { label?: string; group?: string; meta?: TMeta }): void;
  undo(): T | undefined;
  redo(): T | undefined;
  clear(): void;
  reset(value: T, meta?: { label?: string; group?: string; meta?: TMeta }): void;
  checkpoint(meta?: { label?: string; group?: string; meta?: TMeta }): void;
  transaction(initialValue: T): TransactionHandle<T>;
  destroy(): void;
};

/** Callable `$history()` magic with shorthand methods. */
export type HistoryMagic<T, TMeta = unknown> = {
  (value: T, meta?: { label?: string; group?: string; meta?: TMeta }): void;
  readonly current: T | undefined;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  undo(): T | undefined;
  redo(): T | undefined;
  clear(): void;
  reset(value: T, meta?: { label?: string; group?: string; meta?: TMeta }): void;
  checkpoint(meta?: { label?: string; group?: string; meta?: TMeta }): void;
  transaction(initialValue: T): TransactionHandle<T>;
};

/** Typed view of `Alpine` the history plugin uses internally. */
export type HistoryAlpine = Alpine<{ history: HistoryStore<unknown> }> & {
  cleanup?(callback: () => void): void;
};

/** Resolved plugin configuration. */
export type ResolvedHistoryPluginConfig = {
  readonly storeKey: string;
  readonly magicKey: string;
  readonly initialValue?: unknown;
  readonly limit: number;
  readonly maxSize?: number;
  readonly clone?: CloneStrategy<unknown>;
  readonly equality?: EqualityStrategy<unknown>;
  readonly persistence?: PersistenceAdapter<unknown>;
  readonly nestedTransactionPolicy: NestedTransactionPolicy;
  readonly debounceMs?: number;
};

/** `Alpine.plugin()` callback signature. */
export type HistoryPluginCallback = PluginCallback<AlpineBase>;
