/**
 * Public type contracts for `@ailuracode/alpine-form`.
 */

import type { Alpine, PluginCallback, Unsubscribe } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";
import type { FormEvents } from "./events.js";
import type { StandardSchemaV1 } from "./standard-schema.js";

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
  /** @deprecated Use `validators` instead. */
  readonly validate?: FieldValidator;
  readonly validators?: FieldValidators;
}

/** Per-field state snapshot exposed to consumers. */
export interface FieldState {
  readonly path: FieldPath;
  readonly value: unknown;
  readonly initialValue: unknown;
  readonly dirty: boolean;
  readonly touched: boolean;
  readonly errors: readonly string[];
  readonly errorMap: Readonly<Partial<Record<ValidationTrigger, string>>>;
  readonly validating: boolean;
  readonly meta: FieldMeta;
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
  readonly isPristine: boolean;
  readonly canSubmit: boolean;
  readonly formErrors: readonly string[];
  readonly errorMap: Readonly<Partial<Record<ValidationTrigger, string>>>;
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
  readonly validators?: FormValidators;
}

/** When field validation runs automatically (legacy single-trigger mode). */
export type FormValidateOn = "change" | "blur" | "submit";

/** TanStack Form-style validation trigger. */
export type ValidationTrigger = "onChange" | "onBlur" | "onSubmit";

/** Context passed to TanStack-style validator functions. */
export interface ValidatorFnContext<TValues, TValue = unknown> {
  readonly value: TValue;
  readonly values: TValues;
  readonly signal: AbortSignal;
  readonly path: FieldPath;
}

/** TanStack-style field or form validator function. */
export type FormValidatorFn<TValues, TValue = unknown> = (
  context: ValidatorFnContext<TValues, TValue>
) => FormValidatorMessage | Promise<FormValidatorMessage>;

/** Message returned by TanStack-style validators. */
export type FormValidatorMessage = string | undefined;

/** Structured form-level validator result (TanStack `onSubmitAsync` shape). */
export interface FormValidatorObjectResult {
  readonly form?: string;
  readonly fields?: Readonly<Record<FieldPath, string | undefined>>;
}

/** Union result from form-level validators. */
export type FormValidatorResult = FormValidatorMessage | FormValidatorObjectResult | undefined;

/** TanStack Form-style field validators. */
export interface FieldValidators<TValues = Record<string, unknown>, TValue = unknown> {
  readonly onChange?: FormValidatorFn<TValues, TValue> | StandardSchemaV1;
  readonly onChangeAsync?: FormValidatorFn<TValues, TValue>;
  readonly onChangeAsyncDebounceMs?: number;
  readonly onBlur?: FormValidatorFn<TValues, TValue>;
  readonly onBlurAsync?: FormValidatorFn<TValues, TValue>;
  readonly onBlurAsyncDebounceMs?: number;
  readonly onSubmit?: FormValidatorFn<TValues, TValue>;
  readonly onSubmitAsync?: FormValidatorFn<TValues, TValue>;
  readonly onSubmitAsyncDebounceMs?: number;
}

/** TanStack Form-style form-level validators. */
export interface FormValidators<TValues = Record<string, unknown>> {
  readonly onChange?: FormValidatorFn<TValues, TValues> | StandardSchemaV1;
  readonly onChangeAsync?: FormValidatorFn<TValues, TValues>;
  readonly onBlur?: FormValidatorFn<TValues, TValues>;
  readonly onBlurAsync?: FormValidatorFn<TValues, TValues>;
  readonly onSubmit?: FormValidatorFn<TValues, TValues> | StandardSchemaV1;
  readonly onSubmitAsync?: FormValidatorFn<TValues, TValues>;
}

/** Field metadata aligned with TanStack Form `field.state.meta`. */
export interface FieldMeta {
  readonly errors: readonly string[];
  readonly errorMap: Readonly<Partial<Record<ValidationTrigger, string>>>;
  readonly isValid: boolean;
  readonly isTouched: boolean;
  readonly isDirty: boolean;
  readonly isValidating: boolean;
}

/** Field state aligned with TanStack Form `field.state`. */
export interface FieldApiState<TValue = unknown> {
  readonly value: TValue;
  readonly meta: FieldMeta;
}

/** Form state aligned with TanStack Form store selectors. */
export interface FormApiState<TValues extends Record<string, unknown> = Record<string, unknown>> {
  readonly values: TValues;
  readonly canSubmit: boolean;
  readonly isSubmitting: boolean;
  readonly isPristine: boolean;
  readonly isValid: boolean;
  readonly errorMap: Readonly<Partial<Record<ValidationTrigger, string>>>;
}

/** Options for `createForm()` — TanStack Form-like factory. */
export interface CreateFormApiOptions<TValues extends Record<string, unknown>> {
  readonly id?: string;
  readonly defaultValues: TValues;
  readonly onSubmit?: (context: {
    readonly value: TValues;
    readonly signal: AbortSignal;
  }) => void | Promise<void>;
  readonly validators?: FormValidators<TValues>;
  readonly controller?: import("./controller.js").FormController;
}

/** TanStack Form-like form API surface. */
export interface FormApi<TValues extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly state: FormApiState<TValues>;
  handleSubmit(): Promise<void>;
  reset(options?: FormResetOptions): void;
  field<TValue = unknown>(
    name: FieldPath,
    validators?: FieldValidators<TValues, TValue>
  ): FieldApi<TValue>;
  parseValueWithSchema<TValue>(
    schema: StandardSchemaV1<unknown, TValue>,
    value: unknown
  ): Promise<string | undefined>;
  destroy(): void;
  on<K extends keyof FormEvents>(event: K, listener: (detail: FormEvents[K]) => void): Unsubscribe;
  off<K extends keyof FormEvents>(event: K, listener: (detail: FormEvents[K]) => void): void;
}

/** TanStack Form-like field API surface. */
export interface FieldApi<TValue = unknown> {
  readonly name: FieldPath;
  readonly state: FieldApiState<TValue>;
  handleChange(value: TValue): void;
  handleBlur(): void;
  parseValueWithSchema(schema: StandardSchemaV1<unknown, TValue>): Promise<string | undefined>;
}

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
