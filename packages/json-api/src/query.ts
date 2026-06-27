import { type QueryKey, type QueryOptions, queryOptions } from "@ailuracode/alpinejs-query";
import type {
  JsonApiClient,
  JsonApiCollectionDocument,
  JsonApiQueryOptions,
  JsonApiSchema,
  JsonApiSingleDocument,
  SchemaResourceType,
} from "./types.js";

/** Builds a typed `queryOptions` definition for a JSON:API collection request. */
export function jsonApiQueryOptions<
  TSchema extends JsonApiSchema,
  TType extends SchemaResourceType<TSchema>,
  const TKey extends QueryKey,
>(
  options: {
    client: JsonApiClient<TSchema>;
    resource: TType;
    query?: JsonApiQueryOptions<TSchema, TType>;
    queryKey: TKey;
    queryFn?: never;
  } & QueryOptions<JsonApiCollectionDocument<TSchema, TType>>
) {
  const { client, resource, query, queryKey, ...queryOpts } = options;

  return queryOptions({
    queryKey,
    queryFn: () => client.findAll(resource, query),
    ...queryOpts,
  });
}

/** Builds a typed `queryOptions` definition for a single JSON:API resource request. */
export function jsonApiFindOneQueryOptions<
  TSchema extends JsonApiSchema,
  TType extends SchemaResourceType<TSchema>,
  const TKey extends QueryKey,
>(
  options: {
    client: JsonApiClient<TSchema>;
    resource: TType;
    id: string;
    query?: JsonApiQueryOptions<TSchema, TType>;
    queryKey: TKey;
    queryFn?: never;
  } & QueryOptions<JsonApiSingleDocument<TSchema, TType>>
) {
  const { client, resource, id, query, queryKey, ...queryOpts } = options;

  return queryOptions({
    queryKey,
    queryFn: () => client.findOne(resource, id, query),
    ...queryOpts,
  });
}
