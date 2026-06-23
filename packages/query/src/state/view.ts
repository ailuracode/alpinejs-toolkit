import type {
  FetchStatus,
  MutationState,
  MutationStatus,
  QueryState,
  QueryStatus,
} from "../types.js";

export type QueryStateRecord<TData = unknown> = {
  data: TData | undefined;
  error: Error | null;
  status: QueryStatus;
  fetchStatus: FetchStatus;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
};

export type MutationStateRecord<TData = unknown> = {
  data: TData | undefined;
  error: Error | null;
  status: MutationStatus;
};

export function attachQueryFlags<TData>(state: QueryState<TData>, staleTime: number): void {
  Object.defineProperties(state, {
    isPending: {
      get() {
        return state.status === "pending";
      },
    },
    isLoading: {
      get() {
        return state.status === "pending" && state.fetchStatus === "fetching";
      },
    },
    isFetching: {
      get() {
        return state.fetchStatus === "fetching";
      },
    },
    isError: {
      get() {
        return state.status === "error";
      },
    },
    isSuccess: {
      get() {
        return state.status === "success";
      },
    },
    isStale: {
      get() {
        if (state.dataUpdatedAt === 0) {
          return true;
        }

        return Date.now() - state.dataUpdatedAt > staleTime;
      },
    },
  });
}

export function attachMutationFlags<TData, TVariables>(
  mutation: MutationState<TData, TVariables>
): void {
  Object.defineProperties(mutation, {
    isIdle: {
      get() {
        return mutation.status === "idle";
      },
    },
    isPending: {
      get() {
        return mutation.status === "pending";
      },
    },
    isError: {
      get() {
        return mutation.status === "error";
      },
    },
    isSuccess: {
      get() {
        return mutation.status === "success";
      },
    },
  });
}

export function createQueryStateView<TData>(
  getRecord: () => QueryStateRecord<TData>,
  staleTime: number,
  refetch: () => Promise<void>
): QueryState<TData> {
  const state = {
    get data() {
      return getRecord().data;
    },
    get error() {
      return getRecord().error;
    },
    get status() {
      return getRecord().status;
    },
    get fetchStatus() {
      return getRecord().fetchStatus;
    },
    get dataUpdatedAt() {
      return getRecord().dataUpdatedAt;
    },
    get errorUpdatedAt() {
      return getRecord().errorUpdatedAt;
    },
    refetch,
  } as QueryState<TData>;

  attachQueryFlags(state, staleTime);

  return state;
}

export function createMutationStateView<TData, TVariables>(
  getRecord: () => MutationStateRecord<TData>,
  handlers: Pick<MutationState<TData, TVariables>, "mutate" | "reset">
): MutationState<TData, TVariables> {
  const state = {
    get data() {
      return getRecord().data;
    },
    get error() {
      return getRecord().error;
    },
    get status() {
      return getRecord().status;
    },
    mutate: handlers.mutate,
    reset: handlers.reset,
  } as MutationState<TData, TVariables>;

  attachMutationFlags(state);

  return state;
}
