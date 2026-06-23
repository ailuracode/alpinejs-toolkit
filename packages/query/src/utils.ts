import type { QueryKey, QueryOptions, ResolvedQueryOptions } from "./types.js";

export function hashKey(key: QueryKey): string {
  return JSON.stringify(key, (_, value: unknown) => {
    if (typeof value === "bigint") {
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    return value;
  });
}

export function resolveRetryCount(retry: number | boolean | undefined, fallback: number): number {
  if (retry === false) {
    return 0;
  }

  if (retry === true) {
    return 3;
  }

  if (typeof retry === "number") {
    return retry;
  }

  return fallback;
}

export function resolveRetryDelay(
  retryDelay: number | ((attempt: number) => number) | undefined,
  fallback: number | ((attempt: number) => number)
): number | ((attempt: number) => number) {
  return retryDelay ?? fallback;
}

export function getRetryDelay(
  retryDelay: number | ((attempt: number) => number),
  attempt: number
): number {
  return typeof retryDelay === "function" ? retryDelay(attempt) : retryDelay;
}

export function resolveQueryOptions<TData>(
  options: QueryOptions<TData> | undefined,
  defaults: Partial<QueryOptions<TData>>
): ResolvedQueryOptions<TData> {
  const merged = { ...defaults, ...options };

  return {
    enabled: merged.enabled ?? true,
    staleTime: merged.staleTime ?? 0,
    gcTime: merged.gcTime ?? 5 * 60 * 1000,
    refetchOnWindowFocus: merged.refetchOnWindowFocus ?? true,
    refetchInterval: merged.refetchInterval ?? false,
    retry: resolveRetryCount(merged.retry, 3),
    retryDelay: resolveRetryDelay(merged.retryDelay, (attempt) =>
      Math.min(1000 * 2 ** attempt, 30_000)
    ),
    placeholderData: merged.placeholderData,
    initialData: merged.initialData,
  };
}

export function normalizeInvalidationKeys(key?: QueryKey | QueryKey[]): QueryKey[] | null {
  if (key === undefined) {
    return null;
  }

  if (Array.isArray(key) && key.length > 0 && !Array.isArray(key[0])) {
    return [key as QueryKey];
  }

  return key as QueryKey[];
}

export function matchesQueryKey(target: QueryKey, filter: QueryKey): boolean {
  if (filter.length > target.length) {
    return false;
  }

  return filter.every((part, index) => Object.is(part, target[index]));
}
