import type {
  MutationDevtoolsEntry,
  QueryDevtoolsApi,
  QueryDevtoolsEntry,
  QueryDevtoolsSnapshot,
  QueryStore,
} from "@ailuracode/alpine-query";

export type QueryDevtoolsEntryView = QueryDevtoolsEntry & {
  adapterName: string;
  storeId: string;
  entryId: string;
};

export type MutationDevtoolsEntryView = MutationDevtoolsEntry & {
  adapterName: string;
  storeId: string;
  entryId: string;
};

export type QueryDevtoolsSnapshotView = Omit<QueryDevtoolsSnapshot, "queries" | "mutations"> & {
  queries: QueryDevtoolsEntryView[];
  mutations: MutationDevtoolsEntryView[];
};

export type QueryDevtoolsAdapterOption = {
  id: string;
  label: string;
};

export interface MergedQueryDevtools {
  devtools: QueryDevtoolsApi;
  getSnapshotView(): QueryDevtoolsSnapshotView;
  getAdapterOptions(): QueryDevtoolsAdapterOption[];
  getStoresForScope(scope: string): QueryStore[];
  getStoreForQuery(entry: QueryDevtoolsEntryView): QueryStore;
  getStoreForMutation(entry: MutationDevtoolsEntryView): QueryStore;
}

interface StoreContext {
  store: QueryStore;
  storeId: string;
  displayName: string;
}

function assertDevtoolsStore(store: QueryStore): void {
  if (!store.devtools) {
    throw new Error(
      "@ailuracode/alpine-query-kit requires @ailuracode/alpine-query with devtools support"
    );
  }
}

function createStoreContexts(stores: QueryStore[]): StoreContext[] {
  const adapterNames = stores.map((store) => store.devtools.getSnapshot().adapterName);
  const seenByAdapter = new Map<string, number>();

  return stores.map((store, index) => {
    const baseName = adapterNames[index] ?? "";
    const duplicateTotal = adapterNames.filter((name) => name === baseName).length;
    const occurrence = (seenByAdapter.get(baseName) ?? 0) + 1;
    seenByAdapter.set(baseName, occurrence);

    return {
      store,
      storeId: String(index),
      displayName: duplicateTotal > 1 ? `${baseName} #${occurrence}` : baseName,
    };
  });
}

function buildSnapshotView(contexts: StoreContext[]): QueryDevtoolsSnapshotView {
  const queries: QueryDevtoolsEntryView[] = [];
  const mutations: MutationDevtoolsEntryView[] = [];

  for (const context of contexts) {
    const snapshot = context.store.devtools.getSnapshot();

    for (const query of snapshot.queries) {
      queries.push({
        ...query,
        adapterName: context.displayName,
        storeId: context.storeId,
        entryId: `${context.storeId}::${query.keyHash}`,
      });
    }

    for (const mutation of snapshot.mutations) {
      mutations.push({
        ...mutation,
        adapterName: context.displayName,
        storeId: context.storeId,
        entryId: `${context.storeId}::${mutation.id}`,
      });
    }
  }

  const displayNames = contexts.map((context) => context.displayName);

  return {
    adapterName: displayNames.length === 1 ? (displayNames[0] ?? "") : displayNames.join(" · "),
    queries,
    mutations,
    updatedAt: Date.now(),
  };
}

export function createMergedQueryDevtools(stores: QueryStore[]): MergedQueryDevtools {
  const validStores = stores.filter((store) => store.devtools);

  if (validStores.length === 0) {
    throw new Error(
      "@ailuracode/alpine-query-kit requires at least one query store with devtools support"
    );
  }

  for (const store of validStores) {
    assertDevtoolsStore(store);
  }

  const contexts = createStoreContexts(validStores);
  const storeById = new Map(contexts.map((context) => [context.storeId, context.store]));
  const getSnapshotView = (): QueryDevtoolsSnapshotView => buildSnapshotView(contexts);

  const devtools: QueryDevtoolsApi = {
    subscribe(listener) {
      const unsubscribes = validStores.map((store) => store.devtools.subscribe(listener));

      return () => {
        for (const unsubscribe of unsubscribes) {
          unsubscribe();
        }
      };
    },
    getSnapshot() {
      return getSnapshotView();
    },
    clearMutations() {
      for (const context of contexts) {
        context.store.clearMutations();
      }
    },
  };

  return {
    devtools,
    getSnapshotView,
    getAdapterOptions() {
      return contexts.map((context) => ({
        id: context.storeId,
        label: context.displayName,
      }));
    },
    getStoresForScope(scope) {
      if (scope === "all") {
        return contexts.map((context) => context.store);
      }

      const store = storeById.get(scope);
      return store ? [store] : [];
    },
    getStoreForQuery(entry) {
      const store = storeById.get(entry.storeId);

      if (!store) {
        throw new Error(`No query store registered for store id "${entry.storeId}"`);
      }

      return store;
    },
    getStoreForMutation(entry) {
      const store = storeById.get(entry.storeId);

      if (!store) {
        throw new Error(`No query store registered for store id "${entry.storeId}"`);
      }

      return store;
    },
  };
}

export function resolveQueryDevtoolsStores(options: {
  store?: QueryStore;
  stores?: QueryStore[];
  additionalStores?: QueryStore[];
}): QueryStore[] {
  if (options.stores?.length) {
    return [...new Set(options.stores)];
  }

  const stores = [...(options.store ? [options.store] : []), ...(options.additionalStores ?? [])];
  const uniqueStores = [...new Set(stores)];

  if (uniqueStores.length === 0) {
    throw new Error("@ailuracode/alpine-query-kit requires at least one query store");
  }

  return uniqueStores;
}
