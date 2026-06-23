import type { QueryStateAdapter } from "./adapters/types.js";
import type { QueryEntry } from "./cache-internals.js";
import { DevtoolsRegistry } from "./devtools-registry.js";
import type {
  MutationOptions,
  MutationState,
  QueryKey,
  QueryOptions,
  QueryState,
  QueryStatus,
} from "./types.js";
import { getRetryDelay, hashKey, matchesQueryKey, resolveQueryOptions } from "./utils.js";

type QueryCacheConfig = {
  defaultQueryOptions: Partial<QueryOptions>;
  defaultMutationRetry: number;
  defaultMutationRetryDelay: number | ((attempt: number) => number);
};

type QueryCacheOptions = QueryCacheConfig & {
  adapter: QueryStateAdapter;
};

export class QueryCache {
  private readonly entries = new Map<string, QueryEntry>();
  private readonly config: QueryCacheConfig;
  private readonly adapter: QueryStateAdapter;
  private readonly devtools = new DevtoolsRegistry();
  private focusListenerAttached = false;

  constructor(options: QueryCacheOptions) {
    this.config = options;
    this.adapter = options.adapter;
  }

  getDevtools() {
    return {
      subscribe: (listener: () => void) => this.devtools.subscribe(listener),
      getSnapshot: () => this.devtools.buildSnapshot(this.entries.values()),
    };
  }

  getEntries(): QueryEntry[] {
    return [...this.entries.values()];
  }

  getEntryByHash(keyHash: string): QueryEntry | undefined {
    return this.entries.get(keyHash);
  }

  refetchEntry(keyHash: string): Promise<void> | undefined {
    const entry = this.entries.get(keyHash);
    if (!entry) {
      return undefined;
    }

    return this.fetchEntry(entry, true);
  }

  invalidateEntry(keyHash: string): void {
    const entry = this.entries.get(keyHash);
    if (!entry) {
      return;
    }

    entry.isInvalidated = true;
    if (entry.observers > 0) {
      void this.fetchEntry(entry);
    }

    this.devtools.notify();
  }

  removeEntry(keyHash: string): void {
    const entry = this.entries.get(keyHash);
    if (!entry) {
      return;
    }

    this.clearTimers(entry);
    this.entries.delete(keyHash);
    this.devtools.notify();
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

    this.devtools.notify();
  }

  remove(key?: QueryKey | QueryKey[]): void {
    const targets = this.resolveTargets(key);

    for (const entry of targets) {
      this.disposeEntryHandle(entry);
      this.clearTimers(entry);
      this.entries.delete(entry.keyHash);
    }

    this.devtools.notify();
  }

  setData<TData>(key: QueryKey, data: TData | ((current: TData | undefined) => TData)): void {
    const entry = this.entries.get(hashKey(key)) as QueryEntry<TData> | undefined;
    if (!entry) {
      return;
    }

    const nextData =
      typeof data === "function"
        ? (data as (current: TData | undefined) => TData)(entry.handle.get().data)
        : data;
    this.applySuccess(entry, nextData);
  }

  cancel(key: QueryKey): void {
    const entry = this.entries.get(hashKey(key));
    if (!entry) {
      return;
    }

    entry.abortController?.abort();
    entry.handle.patch({ fetchStatus: "idle" });
    this.devtools.notify();
  }

  reset(): void {
    for (const entry of this.entries.values()) {
      this.disposeEntryHandle(entry);
      this.clearTimers(entry);
    }

    this.entries.clear();
    this.devtools.clearMutations();
    this.devtools.notify();
  }

  mutate<TData, TVariables, TContext>(
    options: MutationOptions<TData, TVariables, TContext>
  ): MutationState<TData, TVariables> {
    const handle = this.adapter.createMutationState<TData, TVariables>({
      mutate: async (variables: TVariables) => {
        handle.patch({ status: "pending", error: null });
        const mutationId = this.devtools.trackMutationStart(variables);

        let context: TContext | undefined;

        try {
          context = await options.onMutate?.(variables);
          const data = await this.runMutationWithRetry(options.mutationFn, variables);
          handle.patch({ data, status: "success" });
          this.devtools.trackMutationSuccess(mutationId, data);
          options.onSuccess?.(data, variables, context);
          options.onSettled?.(data, null, variables, context);
          return data;
        } catch (error) {
          const mutationError = error instanceof Error ? error : new Error(String(error));
          handle.patch({ error: mutationError, status: "error" });
          this.devtools.trackMutationError(mutationId, mutationError);
          options.onError?.(mutationError, variables, context);
          options.onSettled?.(undefined, mutationError, variables, context);
          throw mutationError;
        }
      },
      reset: () => {
        handle.patch({
          data: undefined,
          error: null,
          status: "idle",
        });
      },
    });

    return handle.state;
  }

  private ensureEntry<TData>(
    key: QueryKey,
    queryFn: () => Promise<TData>,
    options?: QueryOptions<TData>
  ): QueryEntry<TData> {
    const keyHash = hashKey(key);
    const resolvedOptions = resolveQueryOptions<TData>(
      options,
      this.config.defaultQueryOptions as Partial<QueryOptions<TData>>
    );

    const existing = this.entries.get(keyHash) as QueryEntry<TData> | undefined;
    if (existing) {
      existing.queryFn = queryFn;
      existing.options = resolvedOptions;
      return existing;
    }

    const hasInitialData = resolvedOptions.initialData !== undefined;
    let entryRef: QueryEntry<TData>;

    const handle = this.adapter.createQueryState<TData>(
      {
        data: resolvedOptions.initialData ?? resolvedOptions.placeholderData,
        error: null,
        status: (hasInitialData ? "success" : "pending") as QueryStatus,
        fetchStatus: "idle",
        dataUpdatedAt: hasInitialData ? Date.now() : 0,
        errorUpdatedAt: 0,
      },
      resolvedOptions.staleTime,
      async () => {
        await this.fetchEntry(entryRef, true);
      }
    );

    entryRef = {
      key,
      keyHash,
      queryFn,
      options: resolvedOptions,
      handle,
      state: handle.state,
      observers: 0,
      gcTimeout: null,
      intervalId: null,
      fetchPromise: null,
      abortController: null,
      isInvalidated: false,
    };

    this.entries.set(keyHash, entryRef as QueryEntry);
    this.devtools.notify();
    return entryRef;
  }

  private subscribe<TData>(entry: QueryEntry<TData>): void {
    if (entry.gcTimeout) {
      clearTimeout(entry.gcTimeout);
      entry.gcTimeout = null;
    }

    entry.observers += 1;
    this.ensureFocusListener();
    this.ensureRefetchInterval(entry);
    this.devtools.notify();
  }

  private unsubscribe<TData>(entry: QueryEntry<TData>): void {
    entry.observers = Math.max(0, entry.observers - 1);

    if (entry.observers === 0) {
      this.scheduleGc(entry);
      this.clearRefetchInterval(entry);
    }

    this.devtools.notify();
  }

  private scheduleGc<TData>(entry: QueryEntry<TData>): void {
    if (entry.gcTimeout) {
      clearTimeout(entry.gcTimeout);
    }

    entry.gcTimeout = setTimeout(() => {
      if (entry.observers === 0) {
        this.disposeEntryHandle(entry);
        this.clearTimers(entry);
        this.entries.delete(entry.keyHash);
        this.devtools.notify();
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
    const { dataUpdatedAt } = entry.handle.get();
    if (dataUpdatedAt === 0) {
      return true;
    }

    return Date.now() - entry.handle.get().dataUpdatedAt > entry.options.staleTime;
  }

  private fetchEntry<TData>(entry: QueryEntry<TData>, force = false): Promise<void> | undefined {
    if (!entry.options.enabled) {
      entry.handle.patch({ fetchStatus: "paused" });
      return;
    }

    const current = entry.handle.get();
    if (!force && current.status === "success" && !entry.isInvalidated && !this.isStale(entry)) {
      return;
    }

    if (entry.fetchPromise) {
      return entry.fetchPromise;
    }

    entry.handle.patch({ fetchStatus: "fetching" });
    entry.abortController?.abort();
    entry.abortController = new AbortController();
    this.devtools.notify();

    entry.fetchPromise = this.runQuery(entry)
      .catch(() => {
        // Errors are stored on query state.
      })
      .finally(() => {
        entry.fetchPromise = null;
        entry.isInvalidated = false;
        if (entry.handle.get().fetchStatus === "fetching") {
          entry.handle.patch({ fetchStatus: "idle" });
        }
        this.devtools.notify();
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
    entry.handle.patch({
      data,
      error: null,
      status: "success",
      dataUpdatedAt: Date.now(),
      errorUpdatedAt: 0,
      fetchStatus: "idle",
    });
    this.devtools.notify();
  }

  private applyError<TData>(entry: QueryEntry<TData>, error: Error): void {
    entry.handle.patch({
      error,
      status: "error",
      errorUpdatedAt: Date.now(),
      fetchStatus: "idle",
    });
    this.devtools.notify();
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

  private disposeEntryHandle<TData>(entry: QueryEntry<TData>): void {
    entry.handle.dispose?.();
  }
}
