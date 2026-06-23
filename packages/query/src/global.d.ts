/// <reference types="@types/alpinejs" />

export type QueryKey = readonly unknown[];

export type QueryStatus = "pending" | "error" | "success";

export type FetchStatus = "fetching" | "paused" | "idle";

export type MutationStatus = "idle" | "pending" | "error" | "success";

export interface QueryOptions<TData = unknown> {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number | false;
  retry?: number | boolean;
  retryDelay?: number | ((attempt: number) => number);
  placeholderData?: TData;
  initialData?: TData;
}

export interface QueryState<TData = unknown> {
  data: TData | undefined;
  error: Error | null;
  status: QueryStatus;
  fetchStatus: FetchStatus;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  readonly isPending: boolean;
  readonly isLoading: boolean;
  readonly isFetching: boolean;
  readonly isError: boolean;
  readonly isSuccess: boolean;
  readonly isStale: boolean;
  refetch(): Promise<void>;
}

export interface MutationOptions<TData = unknown, TVariables = void, TContext = unknown> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onMutate?: (variables: TVariables) => Promise<TContext> | TContext;
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void;
}

export interface MutationState<TData = unknown, TVariables = void> {
  data: TData | undefined;
  error: Error | null;
  status: MutationStatus;
  readonly isIdle: boolean;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly isSuccess: boolean;
  mutate(variables: TVariables): Promise<TData>;
  reset(): void;
}

export interface QueryDevtoolsEntry {
  key: QueryKey;
  keyHash: string;
  status: QueryStatus;
  fetchStatus: FetchStatus;
  observers: number;
  isStale: boolean;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  isInvalidated: boolean;
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  data: unknown;
  error: { message: string; name: string } | null;
  options: QueryOptions;
}

export interface MutationDevtoolsEntry {
  id: string;
  status: MutationStatus;
  variables: unknown;
  data: unknown;
  error: { message: string; name: string } | null;
  updatedAt: number;
}

export interface QueryDevtoolsSnapshot {
  queries: QueryDevtoolsEntry[];
  mutations: MutationDevtoolsEntry[];
  updatedAt: number;
}

export interface QueryDevtoolsApi {
  subscribe(listener: () => void): () => void;
  getSnapshot(): QueryDevtoolsSnapshot;
}

export interface QueryPluginOptions {
  defaultOptions?: {
    queries?: Partial<QueryOptions>;
    mutations?: {
      retry?: number | boolean;
      retryDelay?: number | ((attempt: number) => number);
    };
  };
}

export interface QueryStore {
  readonly devtools: QueryDevtoolsApi;
  observe<TData>(
    key: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData>
  ): QueryState<TData> & { destroy(): void };
  fetch<TData>(
    key: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData>
  ): QueryState<TData>;
  get<TData>(key: QueryKey): QueryState<TData> | undefined;
  prefetch<TData>(
    key: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData>
  ): Promise<void>;
  invalidate(key?: QueryKey | QueryKey[]): void;
  remove(key?: QueryKey | QueryKey[]): void;
  setData<TData>(key: QueryKey, data: TData | ((current: TData | undefined) => TData)): void;
  cancel(key: QueryKey): void;
  reset(): void;
  mutate<TData, TVariables = void, TContext = unknown>(
    options: MutationOptions<TData, TVariables, TContext>
  ): MutationState<TData, TVariables>;
}

declare global {
  namespace Alpine {
    interface Stores {
      query: QueryStore;
    }
  }
}
