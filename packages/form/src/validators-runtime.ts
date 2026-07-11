/**
 * Validator runtime for TanStack Form-style validators and Standard Schema.
 */

import {
  isStandardSchema,
  parseFieldWithStandardSchema,
  type StandardSchemaV1,
  standardSchemaIssuesToFieldErrors,
  validateStandardSchema,
} from "./standard-schema.js";
import type {
  FieldPath,
  FieldValidationContext,
  FieldValidator,
  FieldValidators,
  FormValidationContext,
  FormValidatorFn,
  FormValidatorResult,
  FormValidators,
  ValidationAdapter,
  ValidationResult,
  ValidationTrigger,
} from "./types.js";

export type ValidatorSource<TValue = unknown, TValues = Record<string, unknown>> =
  | FieldValidator
  | StandardSchemaV1
  | FormValidatorFn<TValues, TValue>;

/** Returns true when the source is a validator function (not a schema). */
export function isValidatorFn<TValue, TValues>(
  source: ValidatorSource<TValue, TValues>
): source is FormValidatorFn<TValues, TValue> {
  return typeof source === "function";
}

/** Runs a validator source for a field value. */
export async function runValidatorSource<TValue, TValues>(
  source: ValidatorSource<TValue, TValues>,
  value: TValue,
  context: FieldValidationContext
): Promise<string | undefined> {
  if (isStandardSchema(source)) {
    return parseFieldWithStandardSchema(source, value);
  }

  if (!isValidatorFn(source)) {
    return undefined;
  }

  const result = await source({
    value,
    values: context.values as TValues,
    signal: context.signal,
    path: context.path,
  });

  return normalizeValidatorMessage(result);
}

/** Runs a form-level validator source. */
export async function runFormValidatorSource<TValues extends Record<string, unknown>>(
  source: ValidatorSource<TValues, TValues>,
  values: TValues,
  context: FormValidationContext
): Promise<FormValidatorResult> {
  if (isStandardSchema(source)) {
    const issues = await validateStandardSchema(source, values);
    if (issues.length === 0) {
      return undefined;
    }

    const fieldErrors = standardSchemaIssuesToFieldErrors(issues);
    const formMessage = issues.find((issue) => !issue.path)?.message;
    return {
      form: formMessage,
      fields: Object.fromEntries(
        Object.entries(fieldErrors).map(([path, messages]) => [path, messages[0]])
      ),
    };
  }

  if (!isValidatorFn(source)) {
    return undefined;
  }

  const result = await source({
    value: values,
    values,
    signal: context.signal,
    path: "",
  });

  return normalizeFormValidatorResult(result);
}

/** Reads the sync validator for a trigger. */
export function getFieldValidatorForTrigger(
  validators: FieldValidators | undefined,
  trigger: ValidationTrigger
): ValidatorSource | undefined {
  if (!validators) {
    return undefined;
  }
  switch (trigger) {
    case "onChange":
      return validators.onChange;
    case "onBlur":
      return validators.onBlur;
    case "onSubmit":
      return validators.onSubmit;
  }
}

/** Reads the async validator for a trigger. */
export function getFieldAsyncValidatorForTrigger(
  validators: FieldValidators | undefined,
  trigger: ValidationTrigger
): FormValidatorFn<Record<string, unknown>, unknown> | undefined {
  if (!validators) {
    return undefined;
  }
  switch (trigger) {
    case "onChange":
      return validators.onChangeAsync;
    case "onBlur":
      return validators.onBlurAsync;
    case "onSubmit":
      return validators.onSubmitAsync;
  }
}

/** Reads async debounce milliseconds for a trigger. */
export function getFieldAsyncDebounceMs(
  validators: FieldValidators | undefined,
  trigger: ValidationTrigger
): number {
  if (!validators) {
    return 0;
  }
  switch (trigger) {
    case "onChange":
      return validators.onChangeAsyncDebounceMs ?? 0;
    case "onBlur":
      return validators.onBlurAsyncDebounceMs ?? 0;
    case "onSubmit":
      return validators.onSubmitAsyncDebounceMs ?? 0;
  }
}

/** Builds a composite field validator for a specific trigger. */
export function buildTriggerValidator(
  validators: FieldValidators | undefined,
  trigger: ValidationTrigger
): FieldValidator | undefined {
  const sync = getFieldValidatorForTrigger(validators, trigger);
  const asyncValidator = getFieldAsyncValidatorForTrigger(validators, trigger);

  if (!(sync || asyncValidator)) {
    return undefined;
  }

  return async (value, context) => {
    if (sync) {
      const syncError = await runValidatorSource(sync, value, context);
      if (syncError) {
        return syncError;
      }
    }

    if (asyncValidator) {
      return runValidatorSource(asyncValidator, value, context);
    }

    return undefined;
  };
}

/** Builds a validation adapter from TanStack-style form validators. */
export function buildFormValidatorsAdapter<TValues extends Record<string, unknown>>(
  validators: FormValidators<TValues> | undefined,
  trigger: ValidationTrigger
): ValidationAdapter | undefined {
  if (!validators) {
    return undefined;
  }

  const sync = getFormValidatorForTrigger(validators, trigger);
  const asyncValidator = getFormAsyncValidatorForTrigger(validators, trigger);

  if (!(sync || asyncValidator)) {
    return undefined;
  }

  return {
    async validate(values, context) {
      if (sync) {
        const syncResult = await runFormValidatorSource(
          sync as ValidatorSource<TValues, TValues>,
          values as TValues,
          context
        );
        const syncValidation = formValidatorResultToValidationResult(syncResult);
        if (!syncValidation.valid) {
          return syncValidation;
        }
      }

      if (asyncValidator) {
        const asyncResult = await runFormValidatorSource(
          asyncValidator as ValidatorSource<TValues, TValues>,
          values as TValues,
          context
        );
        return formValidatorResultToValidationResult(asyncResult);
      }

      return { valid: true };
    },
  };
}

/** Composes all form-level validator triggers into one adapter. */
export function composeFormValidatorsAdapter<TValues extends Record<string, unknown>>(
  validators: FormValidators<TValues> | undefined
): ValidationAdapter | undefined {
  if (!validators) {
    return undefined;
  }

  const triggers: ValidationTrigger[] = ["onChange", "onBlur", "onSubmit"];
  const adapters = triggers
    .map((trigger) => buildFormValidatorsAdapter(validators, trigger))
    .filter((adapter): adapter is ValidationAdapter => adapter !== undefined);

  if (adapters.length === 0) {
    return undefined;
  }

  return {
    async validate(values, context) {
      for (const adapter of adapters) {
        if (!adapter.validate) {
          continue;
        }
        const result = await adapter.validate(values, context);
        if (!result.valid) {
          return result;
        }
      }
      return { valid: true };
    },
  };
}

function getFormValidatorForTrigger<TValues extends Record<string, unknown>>(
  validators: FormValidators<TValues>,
  trigger: ValidationTrigger
): ValidatorSource<TValues, TValues> | undefined {
  switch (trigger) {
    case "onChange":
      return validators.onChange;
    case "onBlur":
      return validators.onBlur;
    case "onSubmit":
      return validators.onSubmit;
  }
}

function getFormAsyncValidatorForTrigger<TValues extends Record<string, unknown>>(
  validators: FormValidators<TValues>,
  trigger: ValidationTrigger
): FormValidatorFn<TValues, TValues> | undefined {
  switch (trigger) {
    case "onChange":
      return validators.onChangeAsync;
    case "onBlur":
      return validators.onBlurAsync;
    case "onSubmit":
      return validators.onSubmitAsync;
  }
}

function normalizeValidatorMessage(result: unknown): string | undefined {
  if (typeof result === "string" && result.length > 0) {
    return result;
  }
  return undefined;
}

function normalizeFormValidatorResult(result: unknown): FormValidatorResult {
  if (typeof result === "string") {
    return result.length > 0 ? result : undefined;
  }
  if (result === null || result === undefined || typeof result !== "object") {
    return undefined;
  }

  const candidate = result as {
    form?: string;
    fields?: Record<FieldPath, string | undefined>;
  };

  return {
    form: candidate.form,
    fields: candidate.fields,
  };
}

function formValidatorResultToValidationResult(result: FormValidatorResult): ValidationResult {
  if (result === undefined) {
    return { valid: true };
  }

  if (typeof result === "string") {
    return {
      valid: false,
      formErrors: [result],
    };
  }

  const fieldErrors: Record<FieldPath, string[]> = {};
  if (result.fields) {
    for (const [path, message] of Object.entries(result.fields)) {
      if (typeof message === "string" && message.length > 0) {
        fieldErrors[path] = [message];
      }
    }
  }

  const formErrors = result.form ? [result.form] : [];
  const valid = formErrors.length === 0 && Object.keys(fieldErrors).length === 0;

  if (valid) {
    return { valid: true };
  }

  return {
    valid: false,
    fieldErrors,
    formErrors: formErrors.length > 0 ? formErrors : undefined,
  };
}
