/**
 * Public type contracts for `@ailuracode/alpine-form`.
 */

import type { Alpine, PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** Dot-separated field path (e.g. `email`, `address.city`, `items.0.name`). */
export type FieldPath = string;

/** Synchronous or asynchronous field validator. */
export type FieldValidator = (
  value: unknown,
  context: FieldValidationContext
) => string | null | undefined | Promise<string | null | undefined>;

/** Context passed to field-level validators. */
export interface FieldValidationContext {
  readonly path: FieldPath;
  readonly values: Readonly<Record<string, unknown>>;
  readonly signal: AbortSignal;
}

/** Result from a form-level validation adapter. */
export interface ValidationResult {
  readonly valid: boolean;
  readonly fieldErrors?: Readonly<Record<FieldPath, readonly string[]>>;
  readonly formErrors?: readonly string[];
}

/** Pluggable validation adapter for cross-field and async validation. */
export interface ValidationAdapter {
  validate?(
    values: Readonly<Record<string, unknown>>,
    context: FormValidationContext
  ): ValidationResult | Promise<ValidationResult>;
}

/** Context passed to form-level validation adapters. */
export interface FormValidationContext {
  readonly formId: string;
  readonly fields: Readonly<Record<FieldPath, FieldState>>;
  readonly signal: AbortSignal;
}

/** Options when registering a field. */
export interface FieldRegistrationOptions {
  readonly initialValue?: unknown;
  readonly validate?: FieldValidator;
}

/** Per-field state snapshot exposed to consumers. */
export interface FieldState {
  readonly path: FieldPath;
  readonly value: unknown;
  readonly initialValue: unknown;
  readonly dirty: boolean;
  readonly touched: boolean;
  readonly errors: readonly string[];
  readonly validating: boolean;
}

/** Per-form instance state snapshot. */
export interface FormInstance {
  readonly values: Readonly<Record<string, unknown>>;
  readonly initialValues: Readonly<Record<string, unknown>>;
  readonly committedValues: Readonly<Record<string, unknown>>;
  readonly fields: Readonly<Record<FieldPath, FieldState>>;
  readonly dirty: boolean;
  readonly touched: boolean;
  readonly valid: boolean;
  readonly invalid: boolean;
  readonly validating: boolean;
  readonly submitting: boolean;
  readonly submitted: boolean;
  readonly formErrors: readonly string[];
}

/** Discriminator for form change events. */
export type FormChangeSource =
  | "initialization"
  | "register"
  | "unregister"
  | "value"
  | "touch"
  | "validate"
  | "submit"
  | "reset"
  | "server-error";

/** Detail payload for the `change` event. */
export interface FormChangeDetail {
  readonly formId: string;
  readonly source: FormChangeSource;
  readonly fieldPath?: FieldPath;
}

/** Detail payload for the `submit` event. */
export interface FormSubmitDetail {
  readonly formId: string;
  readonly values: Readonly<Record<string, unknown>>;
}

/** Detail payload for the `submit-error` event. */
export interface FormSubmitErrorDetail {
  readonly formId: string;
  readonly error: unknown;
}

/** Options when registering a form instance. */
export interface FormInstanceOptions {
  readonly initialValues?: Readonly<Record<string, unknown>>;
  readonly validateOn?: FormValidateOn;
  readonly adapter?: ValidationAdapter;
}

/** When field validation runs automatically. */
export type FormValidateOn = "change" | "blur" | "submit";

/** Options for `reset()`. */
export interface FormResetOptions {
  /** Reset to values after the last successful submit instead of initial values. */
  readonly toCommitted?: boolean;
}

/** Server-side error mapping input. */
export type ServerFieldErrors = Readonly<Record<FieldPath, readonly string[]>>;

/** Submit handler signature. */
export type FormSubmitHandler = (
  values: Readonly<Record<string, unknown>>,
  context: FormSubmitContext
) => void | Promise<void>;

/** Context passed to submit handlers. */
export interface FormSubmitContext {
  readonly signal: AbortSignal;
}

/** Accessibility options for field props. */
export interface FieldPropsOptions {
  readonly errorId?: string;
  readonly describedBy?: string;
}

/** Alpine-facing store surface. */
export interface FormStore {
  readonly instances: Record<string, FormInstance>;
  register(id: string, options?: FormInstanceOptions): void;
  unregister(id: string): void;
  registerField(formId: string, path: FieldPath, options?: FieldRegistrationOptions): void;
  unregisterField(formId: string, path: FieldPath): void;
  setValue(formId: string, path: FieldPath, value: unknown): void;
  getValue(formId: string, path: FieldPath): unknown;
  touch(formId: string, path: FieldPath): void;
  validate(formId: string): Promise<boolean>;
  submit(formId: string, handler: FormSubmitHandler): Promise<void>;
  reset(formId: string, options?: FormResetOptions): void;
  setServerErrors(formId: string, errors: ServerFieldErrors, formErrors?: readonly string[]): void;
  fieldProps(
    formId: string,
    path: FieldPath,
    options?: FieldPropsOptions
  ): Record<string, string | boolean | undefined>;
  focusFirstError(formId: string, root?: HTMLElement | null): boolean;
  announceErrors(formId: string, liveRegion?: HTMLElement | null): string;
  destroy(): void;
}

/** Internal configuration for the controller factory. */
export type FormStoreConfig = {
  readonly defaultValidateOn?: FormValidateOn;
};

/** Options accepted by the form plugin factory. */
export interface CreateFormOptions {
  readonly id?: string;
  readonly defaultValidateOn?: FormValidateOn;
}

/** Typed view of `Alpine` the form plugin uses internally. */
export type FormAlpine = Alpine<{ form: FormStore }> & {
  cleanup?(callback: () => void): void;
};

/** `Alpine.plugin()` callback signature. */
export type FormPluginCallback = PluginCallback<AlpineBase>;
