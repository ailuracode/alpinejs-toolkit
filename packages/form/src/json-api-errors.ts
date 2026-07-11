/**
 * JSON:API error mapping for `@ailuracode/alpine-form`.
 */

import type { FieldPath, ServerFieldErrors } from "./types.js";

/** Minimal JSON:API error shape — compatible with `@ailuracode/alpine-json-api`. */
export interface JsonApiErrorLike {
  readonly detail?: string;
  readonly title?: string;
  readonly source?: {
    readonly pointer?: string;
    readonly parameter?: string;
  };
}

/** Maps JSON:API errors to field paths and form-level messages. */
export function mapJsonApiErrors(errors: readonly JsonApiErrorLike[]): {
  readonly fieldErrors: ServerFieldErrors;
  readonly formErrors: readonly string[];
} {
  const fieldErrors: Record<FieldPath, string[]> = {};
  const formErrors: string[] = [];

  for (const error of errors) {
    const message = error.detail ?? error.title;
    if (typeof message !== "string" || message.length === 0) {
      continue;
    }

    const pointer = error.source?.pointer;
    const parameter = error.source?.parameter;
    const fieldPath = pointer ? pointerToFieldPath(pointer) : parameter;

    if (fieldPath) {
      fieldErrors[fieldPath] = [...(fieldErrors[fieldPath] ?? []), message];
      continue;
    }

    formErrors.push(message);
  }

  return { fieldErrors, formErrors };
}

/** Converts a JSON:API pointer to a field path. */
export function pointerToFieldPath(pointer: string): FieldPath | null {
  const trimmed = pointer.startsWith("/") ? pointer.slice(1) : pointer;
  const segments = trimmed.split("/").filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return null;
  }

  if (segments[0] === "data") {
    if (segments[1] === "attributes" && segments[2]) {
      return segments.slice(2).join(".");
    }
    if (segments[1] === "relationships" && segments[2]) {
      return segments.slice(2).join(".");
    }
  }

  return segments.join(".");
}
