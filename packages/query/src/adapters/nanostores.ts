import { type MapStore, map } from "nanostores";
import {
  createMutationStateView,
  createQueryStateView,
  type MutationStateRecord,
  type QueryStateRecord,
} from "../state/view.js";
import type { MutationState } from "../types.js";
import type { MutationStateHandle, QueryStateAdapter, QueryStateHandle } from "./types.js";

function patchMapStore<TRecord extends Record<string, unknown>>(
  store: MapStore<TRecord>,
  patch: Partial<TRecord>
): void {
  const current = store.get();
  let next: TRecord | null = null;

  for (const key of Object.keys(patch) as (keyof TRecord)[]) {
    const value = patch[key];
    if (value !== undefined && current[key] !== value) {
      next ??= { ...current };
      next[key] = value as TRecord[keyof TRecord];
    }
  }

  if (next) {
    store.set(next);
  }
}

/** Recommended adapter — Nanostores `map()` stores with listen/subscribe support. */
export const nanostoresQueryAdapter: QueryStateAdapter = {
  createQueryState<TData>(
    initial: QueryStateRecord<TData>,
    staleTime: number,
    refetch: () => Promise<void>
  ): QueryStateHandle<TData> {
    const store = map(initial);
    const state = createQueryStateView(() => store.get(), staleTime, refetch);

    return {
      state,
      get: () => store.get(),
      patch: (patch) => patchMapStore(store, patch),
      listen: (listener) => store.listen(listener),
    };
  },

  createMutationState<TData, TVariables>(
    handlers: Pick<MutationState<TData, TVariables>, "mutate" | "reset">
  ): MutationStateHandle<TData, TVariables> {
    const store = map<MutationStateRecord<TData>>({
      data: undefined,
      error: null,
      status: "idle",
    });
    const state = createMutationStateView(() => store.get(), handlers);

    return {
      state,
      get: () => store.get(),
      patch: (patch) => patchMapStore(store, patch),
      listen: (listener) => store.listen(listener),
    };
  },
};
