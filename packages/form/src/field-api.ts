/**
 * TanStack Form-like field API for `@ailuracode/alpine-form`.
 */

import type { FormController } from "./controller.js";
import { parseFieldWithStandardSchema, type StandardSchemaV1 } from "./standard-schema.js";
import type { FieldApi, FieldApiState, FieldMeta, FieldPath, FieldValidators } from "./types.js";

export function createFieldApi<TValue = unknown>(
  controller: FormController,
  formId: string,
  name: FieldPath,
  validators?: FieldValidators<Record<string, unknown>, TValue>
): FieldApi<TValue> {
  const ensureField = () => {
    if (!controller.hasInstance(formId)) {
      return;
    }
    const snapshot = controller.snapshotInstances()[formId];
    if (!snapshot?.fields[name]) {
      controller.registerField(formId, name, { validators });
    }
  };

  return {
    name,
    get state(): FieldApiState<TValue> {
      ensureField();
      const snapshot = controller.snapshotInstances()[formId];
      const field = snapshot?.fields[name];
      const value = (field?.value ?? controller.getValue(formId, name)) as TValue;
      return {
        value,
        meta: field?.meta ?? createEmptyFieldMeta(),
      };
    },
    handleChange(value: TValue) {
      ensureField();
      controller.setFieldValue(formId, name, value, "onChange");
    },
    handleBlur() {
      ensureField();
      controller.touchField(formId, name, "onBlur");
    },
    parseValueWithSchema(schema: StandardSchemaV1<unknown, TValue>) {
      return parseFieldWithStandardSchema(schema, controller.getValue(formId, name));
    },
  };
}

function createEmptyFieldMeta(): FieldMeta {
  return {
    errors: [],
    errorMap: {},
    isValid: true,
    isTouched: false,
    isDirty: false,
    isValidating: false,
  };
}
