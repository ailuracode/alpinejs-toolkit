import type { MutationState, QueryStateAdapter } from "@ailuracode/alpine-query";
import {
  createMutationStateView,
  createQueryStateView,
  type MutationStateRecord,
  type QueryStateRecord,
} from "@ailuracode/alpine-query";
import { createStore, type StoreApi } from "zustand/vanilla";

function patchZustandStore<TRecord extends Record<string, unknown>>(
  store: StoreApi<TRecord>,
  patch: Partial<TRecord>
): void {
  const current = store.getState();
  let changed = false;
  const next = { ...current };

  for (const key of Object.keys(patch) as (keyof TRecord)[]) {
    const value = patch[key];
    if (value !== undefined && current[key] !== value) {
      next[key] = value as TRecord[keyof TRecord];
      changed = true;
    }
  }

  if (changed) {
    store.setState(next);
  }
}

/** Zustand vanilla store adapter for `@ailuracode/alpine-query`. No official zustand-alpine integration exists. */
export const zustandQueryAdapter: QueryStateAdapter = {
  createQueryState<TData>(
    initial: QueryStateRecord<TData>,
    staleTime: number,
    refetch: () => Promise<void>
  ) {
    const store = createStore<QueryStateRecord<TData>>(() => ({ ...initial }));
    const state = createQueryStateView(() => store.getState(), staleTime, refetch);

    return {
      state,
      get: () => store.getState(),
      patch: (patch: Partial<QueryStateRecord<TData>>) => patchZustandStore(store, patch),
      listen: (listener: (record: QueryStateRecord<TData>) => void) =>
        store.subscribe((record) => listener(record)),
    };
  },

  createMutationState<TData, TVariables>(
    handlers: Pick<MutationState<TData, TVariables>, "mutate" | "reset">
  ) {
    const store = createStore<MutationStateRecord<TData>>(() => ({
      data: undefined,
      error: null,
      status: "idle",
    }));
    const state = createMutationStateView(() => store.getState(), handlers);

    return {
      state,
      get: () => store.getState(),
      patch: (patch: Partial<MutationStateRecord<TData>>) => patchZustandStore(store, patch),
      listen: (listener: (record: MutationStateRecord<TData>) => void) =>
        store.subscribe((record) => listener(record)),
    };
  },
};
