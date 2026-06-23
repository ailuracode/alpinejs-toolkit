import type AlpineType from "alpinejs";
import type {
  FetchStatus,
  MutationOptions,
  MutationState,
  MutationStatus,
  QueryKey,
  QueryOptions,
  QueryState,
  QueryStatus,
  ResolvedQueryOptions,
} from "./types.js";
import { getRetryDelay, hashKey, matchesQueryKey, resolveQueryOptions } from "./utils.js";

type QueryEntry<TData = unknown> = {
  key: QueryKey;
  keyHash: string;
  queryFn: () => Promise<TData>;
  options: ResolvedQueryOptions<TData>;
  state: QueryState<TData>;
  observers: number;
  gcTimeout: ReturnType<typeof setTimeout> | null;
  intervalId: ReturnType<typeof setInterval> | null;
  fetchPromise: Promise<void> | null;
  abortController: AbortController | null;
  isInvalidated: boolean;
};

type QueryCacheConfig = {
  defaultQueryOptions: Partial<QueryOptions>;
  defaultMutationRetry: number;
  defaultMutationRetryDelay: number | ((attempt: number) => number);
};

function attachQueryFlags<TData>(state: QueryState<TData>, staleTime: number): void {
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

function attachMutationFlags<TData, TVariables>(mutation: MutationState<TData, TVariables>): void {
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

export class QueryCache {
  private readonly entries = new Map<string, QueryEntry>();
  private readonly config: QueryCacheConfig;
  private readonly reactive: AlpineType.Alpine["reactive"];
  private focusListenerAttached = false;

  constructor(reactive: AlpineType.Alpine["reactive"], config: QueryCacheConfig) {
    this.reactive = reactive;
    this.config = config;
  }

  observe<TData>(
    key: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData>
  ): QueryState<TData> & { destroy(): void } {
    const entry = this.ensureEntry(key, queryFn, options);
    this.subscribe(entry);
    void this.fetchEntry(entry);

    return Object.assign(entry.state, {
      destroy: () => {
        this.unsubscribe(entry);
      },
    });
  }

  fetch<TData>(
    key: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData>
  ): QueryState<TData> {
    const entry = this.ensureEntry(key, queryFn, options);
    void this.fetchEntry(entry);
    return entry.state;
  }

  get<TData>(key: QueryKey): QueryState<TData> | undefined {
    return this.entries.get(hashKey(key))?.state as QueryState<TData> | undefined;
  }

  async prefetch<TData>(
    key: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData>
  ): Promise<void> {
    const entry = this.ensureEntry(key, queryFn, options);
    await this.fetchEntry(entry);
  }

  invalidate(key?: QueryKey | QueryKey[]): void {
    const targets = this.resolveTargets(key);

    for (const entry of targets) {
      entry.isInvalidated = true;
      if (entry.observers > 0) {
        void this.fetchEntry(entry);
      }
    }
  }

  remove(key?: QueryKey | QueryKey[]): void {
    const targets = this.resolveTargets(key);

    for (const entry of targets) {
      this.clearTimers(entry);
      this.entries.delete(entry.keyHash);
    }
  }

  setData<TData>(key: QueryKey, data: TData | ((current: TData | undefined) => TData)): void {
    const entry = this.entries.get(hashKey(key)) as QueryEntry<TData> | undefined;
    if (!entry) {
      return;
    }

    const nextData =
      typeof data === "function"
        ? (data as (current: TData | undefined) => TData)(entry.state.data)
        : data;
    this.applySuccess(entry, nextData);
  }

  cancel(key: QueryKey): void {
    const entry = this.entries.get(hashKey(key));
    if (!entry) {
      return;
    }

    entry.abortController?.abort();
    entry.state.fetchStatus = "idle";
  }

  reset(): void {
    for (const entry of this.entries.values()) {
      this.clearTimers(entry);
    }

    this.entries.clear();
  }

  mutate<TData, TVariables, TContext>(
    options: MutationOptions<TData, TVariables, TContext>
  ): MutationState<TData, TVariables> {
    const mutation = this.reactive({
      data: undefined as TData | undefined,
      error: null as Error | null,
      status: "idle" as MutationStatus,
      mutate: async (variables: TVariables) => {
        mutation.status = "pending";
        mutation.error = null;

        let context: TContext | undefined;

        try {
          context = await options.onMutate?.(variables);
          const data = await this.runMutationWithRetry(options.mutationFn, variables);
          mutation.data = data;
          mutation.status = "success";
          options.onSuccess?.(data, variables, context);
          options.onSettled?.(data, null, variables, context);
          return data;
        } catch (error) {
          const mutationError = error instanceof Error ? error : new Error(String(error));
          mutation.error = mutationError;
          mutation.status = "error";
          options.onError?.(mutationError, variables, context);
          options.onSettled?.(undefined, mutationError, variables, context);
          throw mutationError;
        }
      },
      reset: () => {
        mutation.data = undefined;
        mutation.error = null;
        mutation.status = "idle";
      },
    }) as MutationState<TData, TVariables>;

    attachMutationFlags(mutation);

    return mutation;
  }

  private ensureEntry<TData>(
    key: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData>
  ): QueryEntry<TData> {
    const keyHash = hashKey(key);
    const resolvedOptions = resolveQueryOptions(options, this.config.defaultQueryOptions);

    const existing = this.entries.get(keyHash) as QueryEntry<TData> | undefined;
    if (existing) {
      existing.queryFn = queryFn;
      existing.options = resolvedOptions;
      return existing;
    }

    const hasInitialData = resolvedOptions.initialData !== undefined;
    const baseState = {
      data: resolvedOptions.initialData ?? resolvedOptions.placeholderData,
      error: null as Error | null,
      status: (hasInitialData ? "success" : "pending") as QueryStatus,
      fetchStatus: "idle" as FetchStatus,
      dataUpdatedAt: hasInitialData ? Date.now() : 0,
      errorUpdatedAt: 0,
      refetch: async () => {
        await this.fetchEntry(entry, true);
      },
    };

    const entry = {
      key,
      keyHash,
      queryFn,
      options: resolvedOptions,
      state: baseState as QueryState<TData>,
      observers: 0,
      gcTimeout: null,
      intervalId: null,
      fetchPromise: null,
      abortController: null,
      isInvalidated: false,
    } as QueryEntry<TData>;

    entry.state = this.reactive(baseState) as QueryState<TData>;
    attachQueryFlags(entry.state, resolvedOptions.staleTime);

    this.entries.set(keyHash, entry as QueryEntry);
    return entry;
  }

  private subscribe<TData>(entry: QueryEntry<TData>): void {
    if (entry.gcTimeout) {
      clearTimeout(entry.gcTimeout);
      entry.gcTimeout = null;
    }

    entry.observers += 1;
    this.ensureFocusListener();
    this.ensureRefetchInterval(entry);
  }

  private unsubscribe<TData>(entry: QueryEntry<TData>): void {
    entry.observers = Math.max(0, entry.observers - 1);

    if (entry.observers === 0) {
      this.scheduleGc(entry);
      this.clearRefetchInterval(entry);
    }
  }

  private scheduleGc<TData>(entry: QueryEntry<TData>): void {
    if (entry.gcTimeout) {
      clearTimeout(entry.gcTimeout);
    }

    entry.gcTimeout = setTimeout(() => {
      if (entry.observers === 0) {
        this.clearTimers(entry);
        this.entries.delete(entry.keyHash);
      }
    }, entry.options.gcTime);
  }

  private ensureRefetchInterval<TData>(entry: QueryEntry<TData>): void {
    this.clearRefetchInterval(entry);

    if (!entry.options.refetchInterval || entry.observers === 0) {
      return;
    }

    entry.intervalId = setInterval(() => {
      if (entry.observers > 0 && entry.options.enabled) {
        void this.fetchEntry(entry, true);
      }
    }, entry.options.refetchInterval);
  }

  private clearRefetchInterval<TData>(entry: QueryEntry<TData>): void {
    if (entry.intervalId) {
      clearInterval(entry.intervalId);
      entry.intervalId = null;
    }
  }

  private clearTimers<TData>(entry: QueryEntry<TData>): void {
    if (entry.gcTimeout) {
      clearTimeout(entry.gcTimeout);
      entry.gcTimeout = null;
    }

    this.clearRefetchInterval(entry);
    entry.abortController?.abort();
    entry.abortController = null;
    entry.fetchPromise = null;
  }

  private ensureFocusListener(): void {
    if (this.focusListenerAttached || typeof window === "undefined") {
      return;
    }

    const onFocus = () => {
      for (const entry of this.entries.values()) {
        if (
          entry.observers > 0 &&
          entry.options.enabled &&
          entry.options.refetchOnWindowFocus &&
          (entry.isInvalidated || this.isStale(entry))
        ) {
          void this.fetchEntry(entry, true);
        }
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        onFocus();
      }
    });

    this.focusListenerAttached = true;
  }

  private isStale<TData>(entry: QueryEntry<TData>): boolean {
    if (entry.state.dataUpdatedAt === 0) {
      return true;
    }

    return Date.now() - entry.state.dataUpdatedAt > entry.options.staleTime;
  }

  private fetchEntry<TData>(entry: QueryEntry<TData>, force = false): Promise<void> | undefined {
    if (!entry.options.enabled) {
      entry.state.fetchStatus = "paused";
      return;
    }

    if (
      !force &&
      entry.state.status === "success" &&
      !entry.isInvalidated &&
      !this.isStale(entry)
    ) {
      return;
    }

    if (entry.fetchPromise) {
      return entry.fetchPromise;
    }

    entry.state.fetchStatus = "fetching";
    entry.abortController?.abort();
    entry.abortController = new AbortController();

    entry.fetchPromise = this.runQuery(entry)
      .catch(() => {
        // Errors are stored on query state.
      })
      .finally(() => {
        entry.fetchPromise = null;
        entry.isInvalidated = false;
        if (entry.state.fetchStatus === "fetching") {
          entry.state.fetchStatus = "idle";
        }
      });

    return entry.fetchPromise;
  }

  private async runQuery<TData>(entry: QueryEntry<TData>): Promise<void> {
    const { retry, retryDelay } = entry.options;
    let attempt = 0;

    while (true) {
      try {
        const data = await entry.queryFn();
        this.applySuccess(entry, data);
        return;
      } catch (error) {
        const queryError = error instanceof Error ? error : new Error(String(error));

        if (attempt >= retry) {
          this.applyError(entry, queryError);
          return;
        }

        attempt += 1;
        await this.delay(getRetryDelay(retryDelay, attempt));
      }
    }
  }

  private applySuccess<TData>(entry: QueryEntry<TData>, data: TData): void {
    entry.state.data = data;
    entry.state.error = null;
    entry.state.status = "success";
    entry.state.dataUpdatedAt = Date.now();
    entry.state.errorUpdatedAt = 0;
    entry.state.fetchStatus = "idle";
  }

  private applyError<TData>(entry: QueryEntry<TData>, error: Error): void {
    entry.state.error = error;
    entry.state.status = "error";
    entry.state.errorUpdatedAt = Date.now();
    entry.state.fetchStatus = "idle";
  }

  private async runMutationWithRetry<TData, TVariables>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    variables: TVariables
  ): Promise<TData> {
    const { defaultMutationRetry, defaultMutationRetryDelay } = this.config;
    let attempt = 0;

    while (true) {
      try {
        return await mutationFn(variables);
      } catch (error) {
        if (attempt >= defaultMutationRetry) {
          throw error;
        }

        attempt += 1;
        await this.delay(getRetryDelay(defaultMutationRetryDelay, attempt));
      }
    }
  }

  private resolveTargets(key?: QueryKey | QueryKey[]): QueryEntry[] {
    if (key === undefined) {
      return [...this.entries.values()];
    }

    const keys =
      Array.isArray(key) && key.length > 0 && !Array.isArray(key[0])
        ? [key as QueryKey]
        : (key as QueryKey[]);

    if (keys.length === 1 && this.entries.has(hashKey(keys[0]))) {
      const entry = this.entries.get(hashKey(keys[0]));
      return entry ? [entry] : [];
    }

    return [...this.entries.values()].filter((entry) =>
      keys.some((filterKey) => matchesQueryKey(entry.key, filterKey))
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}
