import type { MutationStateRecord, QueryStateRecord } from "../state/view.js";
import type { MutationState, QueryState } from "../types.js";

export type QueryStateHandle<TData = unknown> = {
  state: QueryState<TData>;
  get(): QueryStateRecord<TData>;
  patch(patch: Partial<QueryStateRecord<TData>>): void;
  listen(listener: (record: QueryStateRecord<TData>) => void): () => void;
  dispose?(): void;
};

export type MutationStateHandle<TData = unknown, TVariables = void> = {
  state: MutationState<TData, TVariables>;
  get(): MutationStateRecord<TData>;
  patch(patch: Partial<MutationStateRecord<TData>>): void;
  listen(listener: (record: MutationStateRecord<TData>) => void): () => void;
  dispose?(): void;
};

/** Pluggable reactive state layer for query and mutation entries. */
export type QueryStateAdapter = {
  createQueryState<TData>(
    initial: QueryStateRecord<TData>,
    staleTime: number,
    refetch: () => Promise<void>
  ): QueryStateHandle<TData>;

  createMutationState<TData, TVariables>(
    handlers: Pick<MutationState<TData, TVariables>, "mutate" | "reset">
  ): MutationStateHandle<TData, TVariables>;
};
