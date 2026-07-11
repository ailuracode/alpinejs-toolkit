/**
 * TanStack Form-like `createForm()` factory for `@ailuracode/alpine-form`.
 */

import { generateId } from "@ailuracode/alpine-core";
import { createFormController, type FormController } from "./controller.js";
import { createFieldApi } from "./field-api.js";
import type { StandardSchemaV1 } from "./standard-schema.js";
import type {
  CreateFormApiOptions,
  FieldPath,
  FieldValidators,
  FormApi,
  FormApiState,
  FormResetOptions,
  FormValidators,
} from "./types.js";

/**
 * Creates a TanStack Form-like API backed by {@link FormController}.
 *
 * ```ts
 * const form = createForm({
 *   defaultValues: { email: "" },
 *   validators: { onSubmit: signUpSchema },
 *   onSubmit: async ({ value }) => save(value),
 * });
 *
 * form.field("email").handleChange("user@example.com");
 * await form.handleSubmit();
 * ```
 */
export function createForm<TValues extends Record<string, unknown>>(
  options: CreateFormApiOptions<TValues>
): FormApi<TValues> {
  const id = options.id ?? generateId("form");
  const controller = options.controller ?? createFormController();

  controller.register(id, {
    initialValues: options.defaultValues,
    validators: options.validators as FormValidators | undefined,
  });

  const fieldValidators = new Map<FieldPath, FieldValidators<TValues>>();

  const api: FormApi<TValues> = {
    id,
    get state(): FormApiState<TValues> {
      const snapshot = controller.snapshotInstances()[id];
      if (!snapshot) {
        return {
          values: options.defaultValues,
          canSubmit: true,
          isSubmitting: false,
          isPristine: true,
          isValid: true,
          errorMap: {},
        };
      }

      return {
        values: snapshot.values as TValues,
        canSubmit: snapshot.canSubmit,
        isSubmitting: snapshot.submitting,
        isPristine: snapshot.isPristine,
        isValid: snapshot.valid,
        errorMap: snapshot.errorMap,
      };
    },
    async handleSubmit() {
      await controller.submit(id, async (values, context) => {
        if (!options.onSubmit) {
          return;
        }
        await options.onSubmit({
          value: values as TValues,
          signal: context.signal,
        });
      });
    },
    reset(resetOptions?: FormResetOptions) {
      controller.reset(id, resetOptions);
    },
    field<TValue = unknown>(name: FieldPath, validators?: FieldValidators<TValues, TValue>) {
      if (validators) {
        fieldValidators.set(name, validators as FieldValidators<TValues>);
        controller.registerField(id, name, {
          validators: validators as FieldValidators,
        });
      }
      return createFieldApi<TValue>(
        controller,
        id,
        name,
        fieldValidators.get(name) as FieldValidators | undefined
      );
    },
    parseValueWithSchema<TValue>(schema: StandardSchemaV1<unknown, TValue>, value: unknown) {
      return controller.parseValueWithSchema(schema, value);
    },
    destroy() {
      controller.unregister(id);
    },
    on(event, listener) {
      return controller.on(event, listener);
    },
    off(event, listener) {
      controller.off(event, listener);
    },
  };

  return api;
}

/** Builds typed createForm options. */
export function createFormOptions<const T extends CreateFormApiOptions<Record<string, unknown>>>(
  options: T
): T {
  return options;
}

export type { FormController };
