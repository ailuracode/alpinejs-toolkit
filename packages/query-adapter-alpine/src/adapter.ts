import type { MutationState, QueryState, QueryStateAdapter } from "@ailuracode/alpine-query";
import {
  attachMutationFlags,
  attachQueryFlags,
  type MutationStateRecord,
  type QueryStateRecord,
} from "@ailuracode/alpine-query";
import type AlpineType from "alpinejs";

type AlpineInstance = AlpineType.Alpine;

function toQueryRecord<TData>(state: QueryState<TData>): QueryStateRecord<TData> {
  return {
    data: state.data,
    error: state.error,
    status: state.status,
    fetchStatus: state.fetchStatus,
    dataUpdatedAt: state.dataUpdatedAt,
    errorUpdatedAt: state.errorUpdatedAt,
  };
}

function toMutationRecord<TData, TVariables>(
  state: MutationState<TData, TVariables>
): MutationStateRecord<TData> {
  return {
    data: state.data,
    error: state.error,
    status: state.status,
  };
}

/** Native Alpine.reactive adapter — no external store library. */
export function createAlpineStoreAdapter(Alpine: AlpineInstance): QueryStateAdapter {
  return {
    createQueryState<TData>(
      initial: QueryStateRecord<TData>,
      staleTime: number,
      refetch: () => Promise<void>
    ) {
      const state = Alpine.reactive({
        ...initial,
        refetch,
      }) as QueryState<TData>;

      attachQueryFlags(state, staleTime);

      return {
        state,
        get: () => toQueryRecord(state),
        patch: (patch) => {
          Object.assign(state, patch);
        },
        listen: (listener: (record: QueryStateRecord<TData>) => void) => {
          listener(toQueryRecord(state));
          return () => undefined;
        },
      };
    },

    createMutationState<TData, TVariables>(
      handlers: Pick<MutationState<TData, TVariables>, "mutate" | "reset">
    ) {
      const state = Alpine.reactive({
        data: undefined,
        error: null,
        status: "idle",
        mutate: handlers.mutate,
        reset: handlers.reset,
      }) as MutationState<TData, TVariables>;

      attachMutationFlags<TData, TVariables>(state);

      return {
        state,
        get: () => toMutationRecord(state),
        patch: (patch) => {
          Object.assign(state, patch);
        },
        listen: (listener: (record: MutationStateRecord<TData>) => void) => {
          listener(toMutationRecord(state));
          return () => undefined;
        },
      };
    },
  };
}

export { createAlpineStoreAdapter as alpineStoreQueryAdapter };
