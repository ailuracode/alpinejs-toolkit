/**
 * Standard Schema v1 types and helpers for `@ailuracode/alpine-form`.
 *
 * Compatible with Zod 3.24+, Valibot, ArkType, and Effect/Schema without
 * bundling any schema library.
 */

import type { FieldPath, ValidationResult } from "./types.js";

/** Standard Schema issue shape. */
export interface StandardSchemaIssue {
  readonly message: string;
  readonly path?: readonly PropertyKey[];
}

/** Standard Schema validation result. */
export interface StandardSchemaResult<Output = unknown> {
  readonly value?: Output;
  readonly issues?: readonly StandardSchemaIssue[];
}

/** Standard Schema v1 contract (subset used by Zod, Valibot, etc.). */
export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown
    ) => StandardSchemaResult<Output> | Promise<StandardSchemaResult<Output>>;
  };
}

/** Returns true when `value` implements Standard Schema v1. */
export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const candidate = value as StandardSchemaV1;
  return (
    typeof candidate["~standard"] === "object" &&
    candidate["~standard"] !== null &&
    candidate["~standard"].version === 1 &&
    typeof candidate["~standard"].validate === "function"
  );
}

/** Validates a value with a Standard Schema and returns issues. */
export async function validateStandardSchema(
  schema: StandardSchemaV1,
  value: unknown
): Promise<readonly StandardSchemaIssue[]> {
  const result = await schema["~standard"].validate(value);
  return result.issues ?? [];
}

/** Converts Standard Schema issues to field error records. */
export function standardSchemaIssuesToFieldErrors(
  issues: readonly StandardSchemaIssue[]
): Record<FieldPath, string[]> {
  const fieldErrors: Record<FieldPath, string[]> = {};

  for (const issue of issues) {
    const path = issuePathToFieldPath(issue.path);
    if (path) {
      fieldErrors[path] = [...(fieldErrors[path] ?? []), issue.message];
    }
  }

  return fieldErrors;
}

/** Converts a Standard Schema issue path to a dot-separated field path. */
export function issuePathToFieldPath(path: readonly PropertyKey[] | undefined): FieldPath | null {
  if (!path || path.length === 0) {
    return null;
  }
  return path.map((segment) => String(segment)).join(".");
}

/** Creates a form-level validation adapter from a Standard Schema. */
export function createStandardSchemaAdapter(schema: StandardSchemaV1): {
  validate(
    values: Readonly<Record<string, unknown>>,
    context: { signal: AbortSignal }
  ): Promise<ValidationResult>;
} {
  return {
    async validate(values, context) {
      if (context.signal.aborted) {
        return { valid: true };
      }

      const issues = await validateStandardSchema(schema, values);
      if (context.signal.aborted) {
        return { valid: true };
      }

      if (issues.length === 0) {
        return { valid: true };
      }

      const fieldErrors = standardSchemaIssuesToFieldErrors(issues);
      const formErrors = issues
        .filter((issue) => issuePathToFieldPath(issue.path) === null)
        .map((issue) => issue.message);

      return {
        valid: false,
        fieldErrors,
        formErrors: formErrors.length > 0 ? formErrors : undefined,
      };
    },
  };
}

/** Parses a single field value against a Standard Schema. */
export async function parseFieldWithStandardSchema(
  schema: StandardSchemaV1,
  value: unknown
): Promise<string | undefined> {
  const issues = await validateStandardSchema(schema, value);
  return issues[0]?.message;
}
