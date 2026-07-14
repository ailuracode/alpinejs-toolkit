/**
 * Validation helpers for `@ailuracode/alpine-form`.
 */

import type {
  FieldPath,
  FieldValidationContext,
  FieldValidator,
  FormValidationContext,
  ValidationAdapter,
  ValidationResult,
} from "./types.js";

/** Creates a validation adapter from per-field sync validators. */
export function createFieldValidatorsAdapter(
  validators: Readonly<Record<FieldPath, FieldValidator>>
): ValidationAdapter {
  return {
    async validate(values, context) {
      const fieldErrors: Record<FieldPath, string[]> = {};

      for (const [path, validator] of Object.entries(validators)) {
        const message = await validator(getFieldValue(values, path), {
          path,
          values,
          signal: context.signal,
        });
        if (typeof message === "string" && message.length > 0) {
          fieldErrors[path] = [message];
        }
      }

      const keys = Object.keys(fieldErrors);
      if (keys.length === 0) {
        return { valid: true };
      }

      return {
        valid: false,
        fieldErrors,
      };
    },
  };
}

/** Composes multiple validation adapters; merges field and form errors. */
export function composeValidationAdapters(
  adapters: readonly ValidationAdapter[]
): ValidationAdapter {
  return {
    async validate(values, context) {
      return mergeValidationResults(
        await Promise.all(
          adapters
            .filter((adapter) => typeof adapter.validate === "function")
            .map((adapter) => adapter.validate?.(values, context))
        )
      );
    },
  };
}

function mergeValidationResults(results: Array<ValidationResult | undefined>): ValidationResult {
  const mergedFieldErrors: Record<FieldPath, string[]> = {};
  const mergedFormErrors: string[] = [];
  let valid = true;

  for (const result of results) {
    if (!result) {
      continue;
    }
    if (!result.valid) {
      valid = false;
    }
    if (result.fieldErrors) {
      for (const [path, errors] of Object.entries(result.fieldErrors)) {
        mergedFieldErrors[path] = [...(mergedFieldErrors[path] ?? []), ...errors];
      }
    }
    if (result.formErrors) {
      mergedFormErrors.push(...result.formErrors);
    }
  }

  if (valid) {
    return { valid: true };
  }

  return {
    valid: false,
    fieldErrors: mergedFieldErrors,
    formErrors: mergedFormErrors.length > 0 ? mergedFormErrors : undefined,
  };
}

/** Runs a single field validator and normalizes the result. */
export async function runFieldValidator(
  validator: FieldValidator,
  value: unknown,
  context: FieldValidationContext
): Promise<readonly string[]> {
  const message = await validator(value, context);
  if (typeof message === "string" && message.length > 0) {
    return [message];
  }
  return [];
}

/** Runs a validation adapter when present. */
export function runValidationAdapter(
  adapter: ValidationAdapter | undefined,
  values: Readonly<Record<string, unknown>>,
  context: FormValidationContext
): Promise<ValidationResult> {
  if (!adapter?.validate) {
    return Promise.resolve({ valid: true });
  }
  return Promise.resolve(adapter.validate(values, context));
}

function getFieldValue(values: Readonly<Record<string, unknown>>, path: FieldPath): unknown {
  const segments = path.split(".");
  let current: unknown = values;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
