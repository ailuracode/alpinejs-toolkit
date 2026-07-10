/**
 * Alpine.js integration for `@ailuracode/alpine-json-api`.
 *
 * Thin adapter that registers the `$jsonapi` magic with a typed
 * {@link JsonApiClient}. The client is created via
 * {@link createJsonApiClient} (see `./client.ts`).
 */

import type { Alpine } from "alpinejs";
import { createJsonApiClient } from "./client.js";
import type { JsonApiClient, JsonApiPluginOptions, JsonApiSchema } from "./types.js";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link JsonApiPluginOptions} to configure the client.
 */
export function jsonApiPlugin<TSchema extends JsonApiSchema>(
  options: JsonApiPluginOptions<TSchema>
) {
  const client = createJsonApiClient(options.schema, options);

  return function registerJsonApi(alpine: Alpine): void {
    alpine.magic("jsonapi", () => client as JsonApiClient<TSchema>);
  };
}
