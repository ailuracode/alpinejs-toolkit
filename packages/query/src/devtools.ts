import type {
  FetchStatus,
  MutationStatus,
  QueryKey,
  QueryStatus,
  ResolvedQueryOptions,
} from "./types.js";

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
  options: ResolvedQueryOptions;
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

export type DevtoolsListener = () => void;
