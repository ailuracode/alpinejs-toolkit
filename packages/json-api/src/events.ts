/**
 * Strongly-typed event map for the JSON:API client lifecycle.
 */

import type { JsonApiErrorObject, JsonApiSchema, SchemaResourceType } from "./types.js";

/** Detail payload for a request lifecycle event. */
export interface JsonApiRequestDetail<
  TSchema extends JsonApiSchema = JsonApiSchema,
  TType extends SchemaResourceType<TSchema> = SchemaResourceType<TSchema>,
> {
  readonly type: TType;
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  readonly url: string;
}

/** Detail payload for a response lifecycle event. */
export interface JsonApiResponseDetail<
  TSchema extends JsonApiSchema = JsonApiSchema,
  TType extends SchemaResourceType<TSchema> = SchemaResourceType<TSchema>,
> {
  readonly type: TType;
  readonly method: "GET" | "POST" | "PATCH" | "DELETE";
  readonly url: string;
  readonly ok: boolean;
  readonly status: number;
}

/** Detail payload for an error event. */
export interface JsonApiErrorDetail {
  readonly errors: readonly JsonApiErrorObject[];
  readonly status: number;
}

/**
 * Event map for JSON:API request lifecycle. Extends `Record<string, unknown>`
 * per the toolkit convention.
 */
export interface JsonApiEvents extends Record<string, unknown> {
  request: JsonApiRequestDetail;
  response: JsonApiResponseDetail;
  error: JsonApiErrorDetail;
}
