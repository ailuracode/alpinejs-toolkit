import type AlpineType from "alpinejs";
import { createJsonApiClient } from "./client.js";
import type { JsonApiClient, JsonApiPluginOptions, JsonApiSchema } from "./types.js";

/** Alpine.js JSON:API plugin. Registers magic `$jsonapi` with a typed client. */
export default function jsonApiPlugin<TSchema extends JsonApiSchema>(
  options: JsonApiPluginOptions<TSchema>
) {
  const client = createJsonApiClient(options.schema, options);

  return function registerJsonApi(Alpine: AlpineType.Alpine): void {
    Alpine.magic("jsonapi", () => client as JsonApiClient<TSchema>);
  };
}

export { createJsonApiClient } from "./client.js";
export { JsonApiHttpError } from "./errors.js";
export {
  parseCollectionDocument,
  parseJsonApiResponse,
  parseSingleDocument,
  readJsonApiDocument,
} from "./parse.js";
export { jsonApiFindOneQueryOptions, jsonApiQueryOptions } from "./query.js";
export {
  buildJsonApiQuery,
  buildJsonApiUrl,
  createJsonApiHeaders,
  createResourceDocument,
} from "./request.js";
export {
  indexIncludedResources,
  resolveResourceIncluded,
} from "./resolve.js";
export { defineJsonApiSchema } from "./schema.js";
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
export { JSON_API_MEDIA_TYPE } from "./types.js";

declare global {
  namespace Alpine {
    interface Magics<T> {
      $jsonapi: JsonApiClient<JsonApiSchema>;
    }
  }
}
