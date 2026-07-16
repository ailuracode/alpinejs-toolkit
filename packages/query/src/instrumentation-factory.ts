import type { QueryEntry } from "./cache-internals.js";
import type {
  DevtoolsListener,
  MutationDevtoolsEntry,
  QueryDevtoolsEntry,
  QueryDevtoolsSnapshot,
} from "./devtools.js";
import type { QueryCacheInstrumentation } from "./instrumentation.js";

const MAX_MUTATION_HISTORY = 25;

export function serializeDevtoolsValue(value: unknown): unknown {
  if (value === undefined) {
    return undefined;
  }

  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }
}

export function serializeDevtoolsError(
  error: Error | null
): { message: string; name: string } | null {
  if (!error) {
    return null;
  }

  return {
    message: error.message,
    name: error.name,
  };
}

class DevtoolsRegistry implements QueryCacheInstrumentation {
  private readonly listeners = new Set<DevtoolsListener>();
  private readonly mutations: MutationDevtoolsEntry[] = [];
  private mutationCounter = 0;

  subscribe(listener: DevtoolsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  buildSnapshot(entries: Iterable<QueryEntry>, adapterName: string): QueryDevtoolsSnapshot {
    return {
      adapterName,
      queries: [...entries].map((entry) => this.serializeQuery(entry)),
      mutations: [...this.mutations],
      updatedAt: Date.now(),
    };
  }

  trackMutationStart(variables: unknown): string {
    const id = `mutation-${++this.mutationCounter}`;

    this.mutations.unshift({
      id,
      status: "pending",
      variables: serializeDevtoolsValue(variables),
      data: undefined,
      error: null,
      updatedAt: Date.now(),
    });

    this.trimMutations();
    this.notify();
    return id;
  }

  trackMutationSuccess(id: string, data: unknown): void {
    this.updateMutation(id, {
      status: "success",
      data: serializeDevtoolsValue(data),
      error: null,
    });
  }

  trackMutationError(id: string, error: Error): void {
    this.updateMutation(id, {
      status: "error",
      error: serializeDevtoolsError(error),
    });
  }

  clearMutations(): void {
    this.mutations.length = 0;
    this.notify();
  }

  destroy(): void {
    this.listeners.clear();
    this.mutations.length = 0;
  }

  private serializeQuery(entry: QueryEntry): QueryDevtoolsEntry {
    const record = entry.handle.get();
    const { staleTime } = entry.options;

    return {
      key: [...entry.key],
      keyHash: entry.keyHash,
      status: record.status,
      fetchStatus: record.fetchStatus,
      observers: entry.observers,
      isStale: record.dataUpdatedAt === 0 || Date.now() - record.dataUpdatedAt > staleTime,
      isLoading: record.status === "pending" && record.fetchStatus === "fetching",
      isFetching: record.fetchStatus === "fetching",
      isError: record.status === "error",
      isSuccess: record.status === "success",
      isInvalidated: entry.isInvalidated,
      dataUpdatedAt: record.dataUpdatedAt,
      errorUpdatedAt: record.errorUpdatedAt,
      fetchStartedAt: entry.fetchStartedAt,
      fetchDurationMs: resolveFetchDurationMs(entry),
      data: serializeDevtoolsValue(record.data),
      error: serializeDevtoolsError(record.error),
      options: { ...entry.options },
    };
  }

  private updateMutation(id: string, patch: Partial<MutationDevtoolsEntry>): void {
    const mutation = this.mutations.find((item) => item.id === id);
    if (!mutation) {
      return;
    }

    Object.assign(mutation, patch, { updatedAt: Date.now() });
    this.notify();
  }

  private trimMutations(): void {
    if (this.mutations.length > MAX_MUTATION_HISTORY) {
      this.mutations.length = MAX_MUTATION_HISTORY;
    }
  }
}

function resolveFetchDurationMs(entry: QueryEntry): number | null {
  const record = entry.handle.get();

  if (record.fetchStatus === "fetching" && entry.fetchStartedAt !== null) {
    return Date.now() - entry.fetchStartedAt;
  }

  return entry.lastFetchDurationMs;
}

/** Creates query-cache instrumentation for Query Devtools. */
export function createQueryDevtoolsInstrumentation(): QueryCacheInstrumentation {
  return new DevtoolsRegistry();
}
