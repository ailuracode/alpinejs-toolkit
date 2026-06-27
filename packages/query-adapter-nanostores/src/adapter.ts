import type { MutationState, QueryStateAdapter } from "@ailuracode/alpinejs-query";
import {
  createMutationStateView,
  createQueryStateView,
  type MutationStateRecord,
  type QueryStateRecord,
} from "@ailuracode/alpinejs-query";
import { type MapStore, map } from "nanostores";

function patchMapStore<TRecord extends Record<string, unknown>>(
  store: MapStore<TRecord>,
  patch: Partial<TRecord>
): void {
  const current = store.get();
  let next: TRecord | null = null;

  for (const key of Object.keys(patch) as (keyof TRecord)[]) {
    const value = patch[key];
    if (current[key] !== value) {
      next ??= { ...current };
      next[key] = value as TRecord[keyof TRecord];
    }
  }

  if (next) {
    store.set(next);
  }
}

/** Nanostores `map()` adapter for `@ailuracode/alpinejs-query`. */
export const nanostoresQueryAdapter: QueryStateAdapter = {
  name: "Nanostores",

  createQueryState<TData>(
    initial: QueryStateRecord<TData>,
    staleTime: number,
    refetch: () => Promise<void>
  ) {
    const store = map(initial);
    const staleTimeRef = { current: staleTime };
    const state = createQueryStateView(
      () => store.get(),
      () => staleTimeRef.current,
      refetch
    );

    return {
      state,
      get: () => store.get(),
      patch: (patch: Partial<QueryStateRecord<TData>>) => patchMapStore(store, patch),
      listen: (listener: (record: QueryStateRecord<TData>) => void) =>
        store.listen((record) => listener({ ...record })),
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
    const store = map<MutationStateRecord<TData>>({
      data: undefined,
      error: null,
      status: "idle",
    });
    const state = createMutationStateView(() => store.get(), handlers);

    return {
      state,
      get: () => store.get(),
      patch: (patch: Partial<MutationStateRecord<TData>>) => patchMapStore(store, patch),
      listen: (listener: (record: MutationStateRecord<TData>) => void) =>
        store.listen((record) => listener({ ...record })),
    };
  },
};
