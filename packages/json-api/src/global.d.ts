/// <reference types="@types/alpinejs" />

import type { JsonApiClient, JsonApiSchema } from "./types.js";

export type {
  JsonApiErrorDetail,
  JsonApiEvents,
  JsonApiRequestDetail,
  JsonApiResponseDetail,
} from "./events.js";
export type {
  InferAttributes,
  InferRelationshipNames,
  InferRelationshipTarget,
  JsonApiClient,
  JsonApiClientOptions,
  JsonApiCollectionDocument,
  JsonApiCreatePayload,
  JsonApiDocument,
  JsonApiErrorObject,
  JsonApiLinkObject,
  JsonApiLinks,
  JsonApiPluginOptions,
  JsonApiQueryOptions,
  JsonApiRelationship,
  JsonApiRelationshipPayload,
  JsonApiResolvedRelationshipValue,
  JsonApiResource,
  JsonApiResourceIdentifier,
  JsonApiResourceObject,
  JsonApiSchema,
  JsonApiSingleDocument,
  JsonApiUpdatePayload,
  RelationshipSchema,
  ResourceSchema,
  SchemaResourceType,
} from "./types.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $jsonapi: JsonApiClient<JsonApiSchema>;
    }
  }
}
