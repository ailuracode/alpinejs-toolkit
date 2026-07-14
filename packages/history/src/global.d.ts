/// <reference types="@types/alpinejs" />

import type { HistoryManager, HistoryStore } from "./types";

export { createHistoryController, HistoryController } from "./controller";
export { HistoryError, type HistoryErrorCode } from "./error";
export type { HistoryChangeDetail, HistoryEvents } from "./events";
export {
  createHistoryMagic,
  createHistoryStore,
  HISTORY_STORE_KEY,
  historyOptions,
  historyPlugin,
  resolveHistoryPluginConfig,
  wrapHistoryStore,
} from "./store";
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
} from "./types";

export default function historyPlugin(): import("alpinejs").PluginCallback;

declare global {
  namespace Alpine {
    interface Stores {
      history: HistoryStore<unknown>;
    }
    interface Magics<T> {
      $history: HistoryManager<T>;
    }
  }
}
