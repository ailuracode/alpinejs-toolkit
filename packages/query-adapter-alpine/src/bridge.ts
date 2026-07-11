import type {
  MutationState,
  MutationStateHandle,
  QueryState,
  QueryStateAdapter,
  QueryStateHandle,
} from "@ailuracode/alpine-query";
import {
  attachMutationFlags,
  attachQueryFlags,
  type MutationStateRecord,
  type QueryStateRecord,
} from "@ailuracode/alpine-query";
import type AlpineType from "alpinejs";

type AlpineInstance = AlpineType.Alpine;

function syncRecordToReactive<TRecord extends Record<string, unknown>>(
  target: TRecord,
  record: TRecord
): void {
  for (const key of Object.keys(record) as (keyof TRecord)[]) {
    target[key] = record[key];
  }
}

export function bridgeQueryHandleToAlpine<TData>(
  Alpine: AlpineInstance,
  handle: QueryStateHandle<TData>,
  getStaleTime: () => number
): { state: QueryState<TData>; unbind: () => void } {
  const bridged = Alpine.reactive({
    ...handle.get(),
    refetch: handle.state.refetch,
  }) as QueryState<TData>;

  attachQueryFlags(bridged as QueryState<TData>, getStaleTime);

  const unbind = handle.listen((record) => {
    syncRecordToReactive(bridged as QueryStateRecord<TData>, record);
  });

  return { state: bridged, unbind };
}

export function bridgeMutationHandleToAlpine<TData, TVariables>(
  Alpine: AlpineInstance,
  handle: MutationStateHandle<TData, TVariables>
): { state: MutationState<TData, TVariables>; unbind: () => void } {
  const bridged = Alpine.reactive({
    ...handle.get(),
    mutate: handle.state.mutate.bind(handle.state),
    reset: handle.state.reset.bind(handle.state),
  } as MutationState<TData, TVariables>) as MutationState<TData, TVariables>;

  attachMutationFlags(bridged as MutationState<TData, TVariables>);

  const unbind = handle.listen((record) => {
    syncRecordToReactive(bridged as MutationStateRecord<TData>, record);
  });

  return { state: bridged, unbind };
}

/** Wraps any adapter with Alpine.reactive bindings for template usage. */
export function createAlpineBridgedAdapter(
  Alpine: AlpineInstance,
  base: QueryStateAdapter
): QueryStateAdapter {
  return {
    name: base.name,

    createQueryState(initial, staleTime, refetch) {
      const handle = base.createQueryState(initial, staleTime, refetch);
      const getStaleTime = () => handle.getStaleTime?.() ?? staleTime;
      const bridge = bridgeQueryHandleToAlpine(Alpine, handle, getStaleTime);

      return {
        ...handle,
        state: bridge.state,
        dispose: bridge.unbind,
      };
    },

    createMutationState(handlers) {
      const handle = base.createMutationState(handlers);
      const bridge = bridgeMutationHandleToAlpine(Alpine, handle);

      return {
        ...handle,
        state: bridge.state,
        dispose: bridge.unbind,
      };
    },
  };
}
