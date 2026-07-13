export type QueryKey = readonly unknown[];

export type QueryFunctionContext = {
  signal: AbortSignal;
};

export type QueryFunction<TData = unknown> = (context: QueryFunctionContext) => Promise<TData>;

export type CoerceAnyToUnknown<T> = 0 extends 1 & T ? unknown : T;

export type InferQueryData<TQueryFn extends QueryFunction<unknown>> = CoerceAnyToUnknown<
  Awaited<ReturnType<TQueryFn>>
>;

export type QueryData<T> = CoerceAnyToUnknown<T>;

export type QueryDefinition<TKey extends QueryKey = QueryKey, TData = unknown> = {
  queryKey: TKey;
  queryFn: QueryFunction<TData>;
} & QueryOptions<TData>;

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

/** Per-subscription handle returned by `observe()`. Shares `state` with other observers. */
export interface QueryObserver<TData = unknown> extends QueryState<TData> {
  /** Shared reactive query state for this cache entry. */
  readonly state: QueryState<TData>;
  /** Release this observer subscription. Idempotent. */
  destroy(): void;
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
  fetchStartedAt: number | null;
  fetchDurationMs: number | null;
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
  adapterName: string;
  queries: QueryDevtoolsEntry[];
  mutations: MutationDevtoolsEntry[];
  updatedAt: number;
}

export interface QueryDevtoolsApi {
  subscribe(listener: () => void): () => void;
  getSnapshot(): QueryDevtoolsSnapshot;
  clearMutations(): void;
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
    queryFn: QueryFunction<TData>,
    options?: QueryOptions<TData>
  ): QueryObserver<TData>;
  observe<TQueryFn extends QueryFunction<unknown>, TData = InferQueryData<TQueryFn>>(
    key: QueryKey,
    queryFn: TQueryFn,
    options?: QueryOptions<TData>
  ): QueryObserver<TData>;
  observe<
    const TKey extends QueryKey,
    TQueryFn extends QueryFunction<unknown>,
    TData = InferQueryData<TQueryFn>,
  >(
    definition: {
      queryKey: TKey;
      queryFn: TQueryFn;
    } & QueryOptions<TData>
  ): QueryObserver<TData>;
  fetch<TData>(
    key: QueryKey,
    queryFn: QueryFunction<TData>,
    options?: QueryOptions<TData>
  ): QueryState<TData>;
  fetch<TQueryFn extends QueryFunction<unknown>, TData = InferQueryData<TQueryFn>>(
    key: QueryKey,
    queryFn: TQueryFn,
    options?: QueryOptions<TData>
  ): QueryState<TData>;
  fetch<
    const TKey extends QueryKey,
    TQueryFn extends QueryFunction<unknown>,
    TData = InferQueryData<TQueryFn>,
  >(
    definition: {
      queryKey: TKey;
      queryFn: TQueryFn;
    } & QueryOptions<TData>
  ): QueryState<TData>;
  get<TData>(key: QueryKey): QueryState<TData> | undefined;
  prefetch<TData>(
    key: QueryKey,
    queryFn: QueryFunction<TData>,
    options?: QueryOptions<TData>
  ): Promise<void>;
  prefetch<TQueryFn extends QueryFunction<unknown>, TData = InferQueryData<TQueryFn>>(
    key: QueryKey,
    queryFn: TQueryFn,
    options?: QueryOptions<TData>
  ): Promise<void>;
  prefetch<
    const TKey extends QueryKey,
    TQueryFn extends QueryFunction<unknown>,
    TData = InferQueryData<TQueryFn>,
  >(
    definition: {
      queryKey: TKey;
      queryFn: TQueryFn;
    } & QueryOptions<TData>
  ): Promise<void>;
  invalidate(key?: QueryKey | QueryKey[]): void;
  remove(key?: QueryKey | QueryKey[]): void;
  setData<TData>(key: QueryKey, data: TData | ((current: TData | undefined) => TData)): void;
  cancel(key: QueryKey): void;
  reset(): void;
  resetQueries(key?: QueryKey | QueryKey[]): void;
  clearMutations(): void;
  /** Tear down global listeners, timers, in-flight requests, and adapter handles. Idempotent. */
  destroy(): void;
  mutate<TData, TVariables = void, TContext = unknown>(
    options: MutationOptions<TData, TVariables, TContext>
  ): MutationState<QueryData<TData>, QueryData<TVariables>>;
}
