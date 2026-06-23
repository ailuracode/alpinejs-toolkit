import {
  createMutationStateView,
  createQueryStateView,
  type MutationStateRecord,
  type QueryStateRecord,
} from "../state/view.js";
import type { MutationState } from "../types.js";
import type { MutationStateHandle, QueryStateAdapter, QueryStateHandle } from "./types.js";

function patchRecord<TRecord extends Record<string, unknown>>(
  record: TRecord,
  patch: Partial<TRecord>,
  notify: () => void
): void {
  let changed = false;

  for (const [key, value] of Object.entries(patch) as [keyof TRecord, TRecord[keyof TRecord]][]) {
    if (record[key] !== value) {
      record[key] = value;
      changed = true;
    }
  }

  if (changed) {
    notify();
  }
}

function createHandle<TRecord extends Record<string, unknown>, TView>(
  record: TRecord,
  state: TView
): {
  state: TView;
  get(): TRecord;
  patch(patch: Partial<TRecord>): void;
  listen(listener: (value: TRecord) => void): () => void;
} {
  const listeners = new Set<(value: TRecord) => void>();
  const notify = (): void => {
    for (const listener of listeners) {
      listener(record);
    }
  };

  return {
    state,
    get: () => record,
    patch: (patch) => patchRecord(record, patch, notify),
    listen: (listener) => {
      listeners.add(listener);
      listener(record);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Zero-dependency adapter for tests and non-reactive environments. */
export const vanillaQueryAdapter: QueryStateAdapter = {
  createQueryState<TData>(
    initial: QueryStateRecord<TData>,
    staleTime: number,
    refetch: () => Promise<void>
  ): QueryStateHandle<TData> {
    const record: QueryStateRecord<TData> = { ...initial };
    const state = createQueryStateView(() => record, staleTime, refetch);

    return createHandle(record, state);
  },

  createMutationState<TData, TVariables>(
    handlers: Pick<MutationState<TData, TVariables>, "mutate" | "reset">
  ): MutationStateHandle<TData, TVariables> {
    const record: MutationStateRecord<TData> = {
      data: undefined,
      error: null,
      status: "idle",
    };
    const state = createMutationStateView(() => record, handlers);

    return createHandle(record, state);
  },
};
