import type { QueryEntry } from "./cache-internals.js";
import type { QueryDevtoolsSnapshot } from "./devtools.js";

/** Optional query-cache instrumentation (devtools, profilers, etc.). */
export interface QueryCacheInstrumentation {
  subscribe(listener: () => void): () => void;
  notify(): void;
  buildSnapshot(entries: Iterable<QueryEntry>, adapterName: string): QueryDevtoolsSnapshot;
  trackMutationStart(variables: unknown): string;
  trackMutationSuccess(id: string, data: unknown): void;
  trackMutationError(id: string, error: Error): void;
  clearMutations(): void;
  destroy(): void;
}
