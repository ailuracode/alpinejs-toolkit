import type { MutationState, QueryStateAdapter } from "@ailuracode/alpinejs-query";
import {
  createMutationStateView,
  createQueryStateView,
  type MutationStateRecord,
  type QueryStateRecord,
} from "@ailuracode/alpinejs-query";
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
    if (current[key] !== value) {
      next[key] = value as TRecord[keyof TRecord];
      changed = true;
    }
  }

  if (changed) {
    store.setState(next);
  }
}

/** Zustand vanilla store adapter for `@ailuracode/alpinejs-query`. No official zustand-alpine integration exists. */
export const zustandQueryAdapter: QueryStateAdapter = {
  name: "Zustand",

  createQueryState<TData>(
    initial: QueryStateRecord<TData>,
    staleTime: number,
    refetch: () => Promise<void>
  ) {
    const store = createStore<QueryStateRecord<TData>>(() => ({ ...initial }));
    const staleTimeRef = { current: staleTime };
    const state = createQueryStateView(
      () => store.getState(),
      () => staleTimeRef.current,
      refetch
    );

    return {
      state,
      get: () => store.getState(),
      patch: (patch: Partial<QueryStateRecord<TData>>) => patchZustandStore(store, patch),
      listen: (listener: (record: QueryStateRecord<TData>) => void) =>
        store.subscribe((record) => listener(record)),
      setStaleTime(next: number) {
        staleTimeRef.current = next;
      },
      getStaleTime() {
        return staleTimeRef.current;
      },
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
