import type { QueryStateAdapter } from "./adapters/types.js";
import type { QueryDevtoolsApi } from "./devtools.js";

export type QueryKey = readonly unknown[];

export type QueryFunctionContext = {
  signal: AbortSignal;
};

export type QueryFunction<TData = unknown> = (context: QueryFunctionContext) => Promise<TData>;

/** Maps accidental `any` inference (e.g. untyped mocks) to `unknown`. */
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

export interface ResolvedQueryOptions<TData = unknown> {
  enabled: boolean;
  staleTime: number;
  gcTime: number;
  refetchOnWindowFocus: boolean;
  refetchInterval: number | false;
  retry: number;
  retryDelay: number | ((attempt: number) => number);
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

export interface QueryPluginOptions {
  defaultOptions?: {
    queries?: Partial<QueryOptions>;
    mutations?: {
      retry?: number | boolean;
      retryDelay?: number | ((attempt: number) => number);
    };
  };
}

export interface QueryClientOptions extends QueryPluginOptions {
  /** Reactive state adapter. Default: vanilla (zero deps). Use `nanostoresQueryAdapter` for Nanostores. */
  adapter?: QueryStateAdapter;
}

export interface QueryStore {
  readonly devtools: QueryDevtoolsApi;
  /** Pass an explicit data type when `queryFn` is untyped (e.g. test mocks). */
  observe<TData>(
    key: QueryKey,
    queryFn: QueryFunction<TData>,
    options?: QueryOptions<TData>
  ): QueryState<TData> & { destroy(): void };
  observe<TQueryFn extends QueryFunction<unknown>, TData = InferQueryData<TQueryFn>>(
    key: QueryKey,
    queryFn: TQueryFn,
    options?: QueryOptions<TData>
  ): QueryState<TData> & { destroy(): void };
  observe<
    const TKey extends QueryKey,
    TQueryFn extends QueryFunction<unknown>,
    TData = InferQueryData<TQueryFn>,
  >(
    definition: {
      queryKey: TKey;
      queryFn: TQueryFn;
    } & QueryOptions<TData>
  ): QueryState<TData> & { destroy(): void };
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
  /**
   * Forcibly removes cache entries. Cancels timers and in-flight fetches,
   * disposes adapter handles, and unsubscribes devtools listeners. Active
   * observers are detached without decrementing their local subscription; a
   * subsequent `destroy()` on the observe result is a no-op.
   */
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
