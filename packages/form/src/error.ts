/**
 * Public error type for `@ailuracode/alpine-form`.
 */

import { ToolkitError, type ToolkitErrorCode } from "@ailuracode/alpine-core/controller";

export type FormErrorCode =
  | "FORM_NOT_FOUND"
  | "FORM_FIELD_NOT_FOUND"
  | "FORM_ALREADY_SUBMITTING"
  | "FORM_VALIDATION_FAILED";

export function isFormErrorCode(value: unknown): value is FormErrorCode {
  return (
    value === "FORM_NOT_FOUND" ||
    value === "FORM_FIELD_NOT_FOUND" ||
    value === "FORM_ALREADY_SUBMITTING" ||
    value === "FORM_VALIDATION_FAILED"
  );
}

export class FormError extends ToolkitError {
  constructor(message: string, code: FormErrorCode, cause?: unknown) {
    super(message, code as unknown as ToolkitErrorCode, cause);
    this.name = "FormError";
  }
}
