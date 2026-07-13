import type {
  InferQueryData,
  MutationOptions,
  QueryDefinition,
  QueryFunction,
  QueryKey,
  QueryOptions,
} from "./types.js";

export function isQueryDefinition(value: QueryKey | QueryDefinition): value is QueryDefinition {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "queryKey" in value &&
    "queryFn" in value
  );
}

/** Preserves the query function type for stronger `observe()` inference. */
export function queryFn<TData>(fn: QueryFunction<TData>): QueryFunction<TData> {
  return fn;
}

/** Builds a typed query definition with inferred key and data types. */
export function queryOptions<
  const TKey extends QueryKey,
  TQueryFn extends QueryFunction<unknown>,
  TData = InferQueryData<TQueryFn>,
>(
  options: {
    queryKey: TKey;
    queryFn: TQueryFn;
  } & QueryOptions<TData>
): {
  queryKey: TKey;
  queryFn: TQueryFn;
} & QueryOptions<TData> {
  return options;
}

/** Preserves literal query key tuples for typed invalidation and lookups. */
export function queryKey<const TKey extends QueryKey>(key: TKey): TKey {
  return key;
}

/** Builds a typed mutation definition with inferred variables and result. */
export function mutationOptions<TData, TVariables = void, TContext = unknown>(
  options: MutationOptions<TData, TVariables, TContext>
): MutationOptions<TData, TVariables, TContext> {
  return options;
}

export function splitQueryDefinition<TData>(definition: QueryDefinition<QueryKey, TData>): {
  queryKey: QueryKey;
  queryFn: QueryFunction<TData>;
  options: QueryOptions<TData>;
} {
  const { queryKey, queryFn, ...options } = definition;
  return { queryKey, queryFn, options };
}

export type QueryCallOperation = "observe" | "fetch" | "prefetch";

export function normalizeQueryCallArgs(
  operation: QueryCallOperation,
  keyOrDefinition: QueryKey | QueryDefinition,
  queryFn?: QueryFunction<unknown>,
  queryOptions?: QueryOptions<unknown>
): {
  queryKey: QueryKey;
  queryFn: QueryFunction<unknown>;
  options?: QueryOptions<unknown>;
} {
  if (isQueryDefinition(keyOrDefinition)) {
    return splitQueryDefinition(keyOrDefinition);
  }

  if (!queryFn) {
    throw new Error(`queryFn is required when ${operation}() is called with a query key`);
  }

  return { queryKey: keyOrDefinition, queryFn, options: queryOptions };
}
