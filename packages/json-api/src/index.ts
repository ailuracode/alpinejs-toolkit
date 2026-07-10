/**
 * Public entrypoint for `@ailuracode/alpine-json-api`.
 *
 * Re-exports only. Implementation lives in `./client.ts`,
 * `./plugin.ts`, and supporting JSON:API modules under `./*.ts`.
 */

// --- Client (framework-agnostic) ------------------------------------------
export { createJsonApiClient } from "./client";
export { JsonApiHttpError } from "./errors";
// --- Event surface -------------------------------------------------------
export type {
  JsonApiErrorDetail,
  JsonApiEvents,
  JsonApiRequestDetail,
  JsonApiResponseDetail,
} from "./events";
// --- JSON:API helpers ----------------------------------------------------
export {
  parseCollectionDocument,
  parseJsonApiResponse,
  parseSingleDocument,
  readJsonApiDocument,
} from "./parse";
// --- Alpine integration --------------------------------------------------
export { jsonApiPlugin, jsonApiPlugin as default } from "./plugin";
export { jsonApiFindOneQueryOptions, jsonApiQueryOptions } from "./query";
export {
  buildJsonApiQuery,
  buildJsonApiUrl,
  createJsonApiHeaders,
  createResourceDocument,
} from "./request";
export {
  indexIncludedResources,
  resolveResourceIncluded,
} from "./resolve";
export { defineJsonApiSchema } from "./schema";
// --- Public types --------------------------------------------------------
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
} from "./types";
// --- Public constants ----------------------------------------------------
export { JSON_API_MEDIA_TYPE } from "./types";
