/**
 * Alpine.js integration for `@ailuracode/alpine-history`.
 */

import { bridgeControllerStore } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import { HistoryController } from "./controller.js";
import { wrapHistoryStore } from "./store.js";
import type {
  CreateHistoryControllerOptions,
  HistoryAlpine,
  HistoryMagic,
  HistoryPluginCallback,
  HistoryStore,
  ResolvedHistoryPluginConfig,
} from "./types.js";

/** Default store key. */
export const HISTORY_STORE_KEY = "history";

/** Resolves plugin options with defaults. */
export function resolveHistoryPluginConfig(
  options: Partial<CreateHistoryControllerOptions<unknown>> & { storeKey?: string } = {}
): ResolvedHistoryPluginConfig {
  return {
    storeKey: options.storeKey ?? HISTORY_STORE_KEY,
    initialValue: options.initialValue,
    limit: options.limit ?? 100,
    maxSize: options.maxSize,
    clone: options.clone,
    equality: options.equality,
    persistence: options.persistence,
    nestedTransactionPolicy: options.nestedTransactionPolicy ?? "stack",
    debounceMs: options.debounceMs,
  };
}

/** Builds typed history plugin options. */
export function historyOptions<const T extends CreateHistoryControllerOptions<unknown>>(
  options: T
): T {
  return options;
}

/**
 * Builds the callable `$history` magic API.
 */
export function createHistoryMagic<T, TMeta = unknown>(
  _config: ResolvedHistoryPluginConfig,
  getStore: () => HistoryStore<T, TMeta>
): HistoryMagic<T, TMeta> {
  const magic = ((value: T, meta?: { label?: string; group?: string; meta?: TMeta }) => {
    getStore().commit(value, meta);
  }) as HistoryMagic<T, TMeta>;

  Object.defineProperty(magic, "current", {
    get() {
      return getStore().value;
    },
  });

  Object.defineProperty(magic, "canUndo", {
    get() {
      return getStore().canUndo;
    },
  });

  Object.defineProperty(magic, "canRedo", {
    get() {
      return getStore().canRedo;
    },
  });

  magic.undo = () => getStore().undo();
  magic.redo = () => getStore().redo();
  magic.clear = () => getStore().clear();
  magic.reset = (value, meta) => getStore().reset(value, meta);
  magic.checkpoint = (meta) => getStore().checkpoint(meta);
  magic.transaction = (initialValue) => getStore().transaction(initialValue);

  return magic;
}

/** Plugin factory — returns the `Alpine.plugin()` callback. */
export function historyPlugin<T, TMeta = unknown>(
  options: CreateHistoryControllerOptions<T> & {
    storeKey?: string;
  } = {} as CreateHistoryControllerOptions<T> & {
    storeKey?: string;
  }
): HistoryPluginCallback {
  return function registerHistory(alpine: Alpine): void {
    const Alpine = alpine as unknown as HistoryAlpine;
    const config = resolveHistoryPluginConfig(
      options as Partial<CreateHistoryControllerOptions<unknown>> & { storeKey?: string }
    );
    const controller = new HistoryController<T, TMeta>(options);
    const store = wrapHistoryStore<T, TMeta>(controller);

    bridgeControllerStore({
      alpine: Alpine,
      storeKey: config.storeKey as "history",
      store: store as unknown as HistoryStore<unknown>,
      controller,
      subscribe: (reactiveStore) => {
        const sync = () => {
          const rs = reactiveStore as HistoryStore<T, TMeta>;
          rs.value = controller.value;
          rs.canUndo = controller.canUndo;
          rs.canRedo = controller.canRedo;
          rs.undoStack = controller.undoStack;
          rs.redoStack = controller.redoStack;
          rs.transactionDepth = controller.transactionDepth;
        };
        sync();
        return controller.on("change", sync);
      },
    });

    const magic = createHistoryMagic<T, TMeta>(config, () => store);
    Alpine.magic("history", () => magic);
  };
}
