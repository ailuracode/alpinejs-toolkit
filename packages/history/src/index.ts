/**
 * Public entrypoint for `@ailuracode/alpine-history`.
 */

export { createHistoryController, HistoryController } from "./controller.js";
export type { Unsubscribe } from "./core-deps.js";
export { HistoryError, type HistoryErrorCode } from "./error.js";
export type { HistoryChangeDetail, HistoryEvents } from "./events.js";
export {
  createHistoryMagic,
  DEFAULT_HISTORY_MAGIC_KEY,
  HISTORY_STORE_KEY,
  historyOptions,
  historyPlugin,
  historyPlugin as default,
  resolveHistoryPluginConfig,
} from "./plugin.js";
export { createHistoryStore, wrapHistoryStore } from "./store.js";
export type {
  CloneStrategy,
  CreateHistoryControllerOptions,
  EqualityStrategy,
  HistoryAlpine,
  HistoryChangeSource,
  HistoryEntry,
  HistoryEntryMeta,
  HistoryMagic,
  HistoryManager,
  HistoryPluginCallback,
  HistoryStore,
  NestedTransactionPolicy,
  PersistenceAdapter,
  ResolvedHistoryPluginConfig,
  TransactionHandle,
} from "./types.js";
