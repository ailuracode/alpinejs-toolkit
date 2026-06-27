import { typedFetch } from "@ailuracode/alpinejs-query";
import { parseCollectionDocument, parseJsonApiResponse, parseSingleDocument } from "./parse.js";
import {
  buildJsonApiQuery,
  buildJsonApiUrl,
  createJsonApiHeaders,
  createResourceDocument,
} from "./request.js";
import type {
  JsonApiClient,
  JsonApiClientOptions,
  JsonApiCollectionDocument,
  JsonApiCreatePayload,
  JsonApiDocument,
  JsonApiQueryOptions,
  JsonApiSchema,
  JsonApiSingleDocument,
  JsonApiUpdatePayload,
  SchemaResourceType,
} from "./types.js";

function mergeHeaders(
  defaults: Record<string, string>,
  init?: RequestInit
): Record<string, string> {
  if (!init?.headers) {
    return defaults;
  }

  if (init.headers instanceof Headers) {
    return {
      ...defaults,
      ...Object.fromEntries(init.headers.entries()),
    };
  }

  if (Array.isArray(init.headers)) {
    return {
      ...defaults,
      ...Object.fromEntries(init.headers),
    };
  }

  return {
    ...defaults,
    ...init.headers,
  };
}

export function createJsonApiClient<TSchema extends JsonApiSchema>(
  schema: TSchema,
  options: JsonApiClientOptions
): JsonApiClient<TSchema> {
  const fetcher = options.fetcher ?? fetch;

  async function request<TDocument>(
    url: string,
    init: RequestInit | undefined,
    mapDocument: (document: JsonApiDocument) => TDocument
  ): Promise<TDocument> {
    const headers = createJsonApiHeaders(
      mergeHeaders(options.headers ?? {}, init),
      init?.body !== undefined
    );

    const response = await fetcher(url, {
      ...init,
      headers,
    });

    return parseJsonApiResponse(response, mapDocument);
  }

  return {
    schema,

    findAll<TType extends SchemaResourceType<TSchema>>(
      type: TType,
      query?: JsonApiQueryOptions<TSchema, TType>
    ): Promise<JsonApiCollectionDocument<TSchema, TType>> {
      const queryString = buildJsonApiQuery(query);
      const url = buildJsonApiUrl(options.baseUrl, type, undefined, queryString);

      return request(url, { method: "GET" }, (document) =>
        parseCollectionDocument<TSchema, TType>(document, type)
      );
    },

    findOne<TType extends SchemaResourceType<TSchema>>(
      type: TType,
      id: string,
      query?: JsonApiQueryOptions<TSchema, TType>
    ): Promise<JsonApiSingleDocument<TSchema, TType>> {
      const queryString = buildJsonApiQuery(query);
      const url = buildJsonApiUrl(options.baseUrl, type, id, queryString);

      return request(url, { method: "GET" }, (document) =>
        parseSingleDocument<TSchema, TType>(document, type)
      );
    },

    create<TType extends SchemaResourceType<TSchema>>(
      type: TType,
      payload: JsonApiCreatePayload<TSchema, TType>
    ): Promise<JsonApiSingleDocument<TSchema, TType>> {
      const url = buildJsonApiUrl(options.baseUrl, type);
      const body = JSON.stringify(
        createResourceDocument(type, {
          attributes: payload.attributes,
          relationships: payload.relationships,
        })
      );

      return request(
        url,
        {
          method: "POST",
          body,
        },
        (document) => parseSingleDocument<TSchema, TType>(document, type)
      );
    },

    update<TType extends SchemaResourceType<TSchema>>(
      type: TType,
      id: string,
      payload: JsonApiUpdatePayload<TSchema, TType>
    ): Promise<JsonApiSingleDocument<TSchema, TType>> {
      const url = buildJsonApiUrl(options.baseUrl, type, id);
      const body = JSON.stringify(
        createResourceDocument(
          type,
          {
            attributes: payload.attributes,
            relationships: payload.relationships,
          },
          id
        )
      );

      return request(
        url,
        {
          method: "PATCH",
          body,
        },
        (document) => parseSingleDocument<TSchema, TType>(document, type)
      );
    },

    async delete<TType extends SchemaResourceType<TSchema>>(
      type: TType,
      id: string
    ): Promise<void> {
      const url = buildJsonApiUrl(options.baseUrl, type, id);

      await typedFetch<void>(url, {
        fetcher,
        method: "DELETE",
        headers: createJsonApiHeaders(options.headers ?? {}),
      });
    },
  };
}
