/**
 * Form controller — the framework-agnostic core of
 * `@ailuracode/alpine-form`.
 */

import {
  announceFormErrors,
  buildErrorAnnouncement,
  createFieldAriaProps,
  focusFirstInvalidField,
} from "./accessibility.js";
import { BaseController, generateId } from "./core-deps.js";
import { FormError } from "./error.js";
import type { FormEvents } from "./events.js";
import { AsyncGuard } from "./internal/async-guard.js";
import { DebounceRegistry } from "./internal/debounce.js";
import { normalizeFormInstanceOptions, normalizeFormStoreConfig } from "./options.js";
import {
  deleteValueAtPath,
  getValueAtPath,
  normalizePath,
  setValueAtPath,
  valuesEqual,
} from "./paths.js";
import { parseFieldWithStandardSchema, type StandardSchemaV1 } from "./standard-schema.js";
import type {
  FieldMeta,
  FieldPath,
  FieldPropsOptions,
  FieldRegistrationOptions,
  FieldState,
  FieldValidator,
  FieldValidators,
  FormChangeSource,
  FormInstance,
  FormInstanceOptions,
  FormResetOptions,
  FormStoreConfig,
  FormSubmitHandler,
  FormValidators,
  ServerFieldErrors,
  ValidationAdapter,
  ValidationTrigger,
} from "./types.js";
import { runFieldValidator, runValidationAdapter } from "./validation.js";
import {
  buildFormValidatorsAdapter,
  buildTriggerValidator,
  getFieldAsyncDebounceMs,
  getFieldAsyncValidatorForTrigger,
  getFieldValidatorForTrigger,
} from "./validators-runtime.js";

interface InternalField {
  path: FieldPath;
  initialValue: unknown;
  dirty: boolean;
  touched: boolean;
  errors: string[];
  errorMap: Partial<Record<ValidationTrigger, string>>;
  validating: boolean;
  validator?: FieldValidator;
  validators?: FieldValidators;
  debounce: DebounceRegistry;
}

interface InternalForm {
  values: Record<string, unknown>;
  initialValues: Record<string, unknown>;
  committedValues: Record<string, unknown>;
  fields: Record<FieldPath, InternalField>;
  formErrors: string[];
  formErrorMap: Partial<Record<ValidationTrigger, string>>;
  validateOn: "change" | "blur" | "submit";
  adapter?: ValidationAdapter;
  formValidators?: FormValidators;
  submitting: boolean;
  submitted: boolean;
  validationGuard: AsyncGuard;
  submitController: AbortController | null;
  fieldOrder: FieldPath[];
}

function cloneValues(values: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return structuredClone(values);
}

function createFieldMeta(field: InternalField): FieldMeta {
  return {
    errors: [...field.errors],
    errorMap: { ...field.errorMap },
    isValid: field.errors.length === 0,
    isTouched: field.touched,
    isDirty: field.dirty,
    isValidating: field.validating,
  };
}

function snapshotField(
  field: InternalField,
  values: Readonly<Record<string, unknown>>
): FieldState {
  return {
    path: field.path,
    value: getValueAtPath(values, field.path),
    initialValue: field.initialValue,
    dirty: field.dirty,
    touched: field.touched,
    errors: [...field.errors],
    errorMap: { ...field.errorMap },
    validating: field.validating,
    meta: createFieldMeta(field),
  };
}

function snapshotForm(form: InternalForm): FormInstance {
  const fields: Record<FieldPath, FieldState> = {};
  for (const [path, field] of Object.entries(form.fields)) {
    fields[path] = snapshotField(field, form.values);
  }

  const dirty = Object.values(form.fields).some((field) => field.dirty);
  const touched = Object.values(form.fields).some((field) => field.touched);
  const validating = Object.values(form.fields).some((field) => field.validating);
  const hasFieldErrors = Object.values(form.fields).some((field) => field.errors.length > 0);
  const invalid = hasFieldErrors || form.formErrors.length > 0;
  const isPristine = !dirty;

  return {
    values: cloneValues(form.values),
    initialValues: cloneValues(form.initialValues),
    committedValues: cloneValues(form.committedValues),
    fields,
    dirty,
    touched,
    valid: !(invalid || validating),
    invalid,
    validating,
    submitting: form.submitting,
    submitted: form.submitted,
    isPristine,
    canSubmit: !(invalid || form.submitting),
    formErrors: [...form.formErrors],
    errorMap: { ...form.formErrorMap },
  };
}

/**
 * Headless form controller. Manages multiple form instances with field
 * registration, validation, submission, and reset lifecycle.
 */
export class FormController extends BaseController<FormEvents> {
  readonly #forms: Record<string, InternalForm> = {};
  readonly #defaultValidateOn: "change" | "blur" | "submit";

  constructor(config: FormStoreConfig = {}, id?: string) {
    super(id ?? generateId("form"));
    const normalized = normalizeFormStoreConfig(config);
    this.#defaultValidateOn = normalized.defaultValidateOn ?? "submit";
  }

  hasInstance(id: string): boolean {
    return id in this.#forms;
  }

  snapshotInstances(): Record<string, FormInstance> {
    const result: Record<string, FormInstance> = {};
    for (const [id, form] of Object.entries(this.#forms)) {
      result[id] = snapshotForm(form);
    }
    return result;
  }

  register(id: string, options: FormInstanceOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }

    const normalized = normalizeFormInstanceOptions(options, {
      defaultValidateOn: this.#defaultValidateOn,
    });
    const initialValues = cloneValues(normalized.initialValues ?? {});

    this.#forms[id] = {
      values: cloneValues(initialValues),
      initialValues,
      committedValues: cloneValues(initialValues),
      fields: {},
      formErrors: [],
      formErrorMap: {},
      validateOn: normalized.validateOn,
      adapter: normalized.adapter,
      formValidators: normalized.validators,
      submitting: false,
      submitted: false,
      validationGuard: new AsyncGuard(),
      submitController: null,
      fieldOrder: [],
    };

    this.#notifyChange(id, "register");
  }

  unregister(id: string): void {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#forms[id];
    if (!form) {
      return;
    }

    form.submitController?.abort();
    Reflect.deleteProperty(this.#forms, id);
    this.#notifyChange(id, "unregister");
  }

  registerField(formId: string, path: FieldPath, options: FieldRegistrationOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#requireForm(formId);
    const normalizedPath = normalizePath(path);
    const initialValue = options.initialValue ?? getValueAtPath(form.values, normalizedPath) ?? "";

    if (!(normalizedPath in form.fields)) {
      form.fieldOrder.push(normalizedPath);
    }

    setValueAtPath(form.values, normalizedPath, initialValue);
    if (getValueAtPath(form.initialValues, normalizedPath) === undefined) {
      setValueAtPath(form.initialValues, normalizedPath, initialValue);
    }
    if (getValueAtPath(form.committedValues, normalizedPath) === undefined) {
      setValueAtPath(form.committedValues, normalizedPath, initialValue);
    }

    form.fields[normalizedPath] = {
      path: normalizedPath,
      initialValue,
      dirty: false,
      touched: false,
      errors: [],
      errorMap: {},
      validating: false,
      validator: options.validate ?? buildTriggerValidator(options.validators, "onSubmit"),
      validators: options.validators,
      debounce: new DebounceRegistry(),
    };

    this.#notifyChange(formId, "register", normalizedPath);
  }

  unregisterField(formId: string, path: FieldPath): void {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#requireForm(formId);
    const normalizedPath = normalizePath(path);
    if (!(normalizedPath in form.fields)) {
      return;
    }

    const { [normalizedPath]: removed, ...remainingFields } = form.fields;
    removed.debounce.clear();
    form.fields = remainingFields;
    form.fieldOrder = form.fieldOrder.filter((entry) => entry !== normalizedPath);
    deleteValueAtPath(form.values, normalizedPath);

    this.#notifyChange(formId, "unregister", normalizedPath);
  }

  setValue(formId: string, path: FieldPath, value: unknown): void {
    this.setFieldValue(formId, path, value, "onChange");
  }

  setFieldValue(
    formId: string,
    path: FieldPath,
    value: unknown,
    trigger: ValidationTrigger = "onChange"
  ): void {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#requireForm(formId);
    const normalizedPath = normalizePath(path);
    const field = form.fields[normalizedPath];
    const previous = getValueAtPath(form.values, normalizedPath);

    if (valuesEqual(previous, value)) {
      return;
    }

    setValueAtPath(form.values, normalizedPath, value);

    if (field) {
      const initial = getValueAtPath(form.initialValues, normalizedPath);
      field.dirty = !valuesEqual(value, initial);
    }

    this.#notifyChange(formId, "value", normalizedPath);
    this.#scheduleFieldValidation(formId, form, normalizedPath, trigger);
  }

  getValue(formId: string, path: FieldPath): unknown {
    const form = this.#forms[formId];
    if (!form) {
      return undefined;
    }
    return getValueAtPath(form.values, normalizePath(path));
  }

  touch(formId: string, path: FieldPath): void {
    this.touchField(formId, path, "onBlur");
  }

  touchField(formId: string, path: FieldPath, trigger: ValidationTrigger = "onBlur"): void {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#requireForm(formId);
    const normalizedPath = normalizePath(path);
    const field = form.fields[normalizedPath];
    if (!field) {
      return;
    }

    if (!field.touched) {
      field.touched = true;
      this.#notifyChange(formId, "touch", normalizedPath);
    }

    this.#scheduleFieldValidation(formId, form, normalizedPath, trigger);
  }

  parseValueWithSchema<TValue>(
    schema: StandardSchemaV1<unknown, TValue>,
    value: unknown
  ): Promise<string | undefined> {
    return parseFieldWithStandardSchema(schema, value);
  }

  validate(formId: string): Promise<boolean> {
    if (this.isDestroyed) {
      return Promise.resolve(false);
    }

    const form = this.#requireForm(formId);
    return this.#validateForm(formId, form, undefined, "onSubmit");
  }

  #scheduleFieldValidation(
    formId: string,
    form: InternalForm,
    path: FieldPath,
    trigger: ValidationTrigger
  ): void {
    const field = form.fields[path];
    if (!field) {
      this.#scheduleLegacyValidation(formId, form, path, trigger);
      return;
    }

    if (this.#scheduleDebouncedValidation(formId, form, path, trigger, field)) {
      return;
    }

    if (this.#hasTriggerValidator(field, trigger)) {
      void this.#validateForm(formId, form, path, trigger);
      return;
    }

    this.#scheduleLegacyValidation(formId, form, path, trigger);
  }

  #hasTriggerValidator(field: InternalField, trigger: ValidationTrigger): boolean {
    return Boolean(
      getFieldValidatorForTrigger(field.validators, trigger) ??
        getFieldAsyncValidatorForTrigger(field.validators, trigger)
    );
  }

  #scheduleDebouncedValidation(
    formId: string,
    form: InternalForm,
    path: FieldPath,
    trigger: ValidationTrigger,
    field: InternalField
  ): boolean {
    if (!this.#hasTriggerValidator(field, trigger)) {
      return false;
    }

    const debounceValue = getFieldAsyncDebounceMs(field.validators, trigger);
    if (debounceValue > 0 && getFieldAsyncValidatorForTrigger(field.validators, trigger)) {
      field.debounce.schedule(`${path}:${trigger}`, debounceValue, () => {
        void this.#validateForm(formId, form, path, trigger);
      });
      return true;
    }

    return false;
  }

  #scheduleLegacyValidation(
    formId: string,
    form: InternalForm,
    path: FieldPath,
    trigger: ValidationTrigger
  ): void {
    if (form.validateOn === "change" && trigger === "onChange") {
      void this.#validateForm(formId, form, path, trigger);
    }
    if (form.validateOn === "blur" && trigger === "onBlur") {
      void this.#validateForm(formId, form, path, trigger);
    }
  }

  async submit(formId: string, handler: FormSubmitHandler): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#requireForm(formId);
    if (form.submitting) {
      throw new FormError(`Form "${formId}" is already submitting`, "FORM_ALREADY_SUBMITTING");
    }

    const valid = await this.#validateForm(formId, form, undefined, "onSubmit");
    if (!valid) {
      throw new FormError(`Form "${formId}" failed validation`, "FORM_VALIDATION_FAILED");
    }

    form.submitController?.abort();
    const controller = new AbortController();
    form.submitController = controller;
    form.submitting = true;
    this.#notifyChange(formId, "submit");

    try {
      await handler(cloneValues(form.values), { signal: controller.signal });
      if (controller.signal.aborted || this.isDestroyed) {
        return;
      }

      form.committedValues = cloneValues(form.values);
      form.submitted = true;
      this.emit("submit", { formId, values: cloneValues(form.values) });
      this.#notifyChange(formId, "submit");
    } catch (error) {
      if (!controller.signal.aborted) {
        this.emit("submit-error", { formId, error });
      }
      throw error;
    } finally {
      if (form.submitController === controller) {
        form.submitting = false;
        form.submitController = null;
        this.#notifyChange(formId, "submit");
      }
    }
  }

  reset(formId: string, options: FormResetOptions = {}): void {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#requireForm(formId);
    const source = options.toCommitted ? form.committedValues : form.initialValues;
    form.values = cloneValues(source);
    form.formErrors = [];
    form.formErrorMap = {};
    form.submitted = false;
    form.validationGuard.reset();

    for (const field of Object.values(form.fields)) {
      const value = getValueAtPath(form.values, field.path);
      field.initialValue = getValueAtPath(form.initialValues, field.path);
      field.dirty = false;
      field.touched = false;
      field.errors = [];
      field.errorMap = {};
      field.validating = false;
      if (value !== undefined) {
        setValueAtPath(form.values, field.path, value);
      }
    }

    this.#notifyChange(formId, "reset");
  }

  setServerErrors(
    formId: string,
    errors: ServerFieldErrors,
    formErrors: readonly string[] = []
  ): void {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#requireForm(formId);
    form.formErrors = [...formErrors];

    for (const field of Object.values(form.fields)) {
      field.errors = [];
    }

    for (const [path, messages] of Object.entries(errors)) {
      const normalizedPath = normalizePath(path);
      const field = form.fields[normalizedPath];
      if (field) {
        field.errors = [...messages];
      } else {
        form.formErrors = [...form.formErrors, ...messages];
      }
    }

    this.#notifyChange(formId, "server-error");
  }

  fieldProps(
    formId: string,
    path: FieldPath,
    options: FieldPropsOptions = {}
  ): Record<string, string | boolean | undefined> {
    const form = this.#forms[formId];
    if (!form) {
      return {};
    }

    const field = form.fields[normalizePath(path)];
    return createFieldAriaProps(field?.errors ?? [], options);
  }

  focusFirstError(formId: string, root?: HTMLElement | null): boolean {
    const form = this.#forms[formId];
    if (!(form && root)) {
      return false;
    }
    return focusFirstInvalidField(root, form.fieldOrder);
  }

  announceErrors(formId: string, liveRegion?: HTMLElement | null): string {
    const form = this.#forms[formId];
    if (!form) {
      return "";
    }

    const fieldErrors: Record<FieldPath, readonly string[]> = {};
    for (const [path, field] of Object.entries(form.fields)) {
      if (field.errors.length > 0) {
        fieldErrors[path] = field.errors;
      }
    }

    const announcement = buildErrorAnnouncement(fieldErrors, form.formErrors);
    return announceFormErrors(liveRegion ?? null, announcement);
  }

  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    for (const form of Object.values(this.#forms)) {
      form.submitController?.abort();
      form.validationGuard.bump();
      for (const field of Object.values(form.fields)) {
        field.debounce.clear();
      }
    }

    super.destroy();
  }

  #requireForm(formId: string): InternalForm {
    const form = this.#forms[formId];
    if (!form) {
      throw new FormError(`Form "${formId}" is not registered`, "FORM_NOT_FOUND");
    }
    return form;
  }

  async #validateForm(
    formId: string,
    form: InternalForm,
    changedPath?: FieldPath,
    trigger: ValidationTrigger = "onSubmit"
  ): Promise<boolean> {
    const generation = form.validationGuard.bump();
    const controller = new AbortController();
    const targets = this.#validationTargets(form, changedPath, trigger);

    for (const field of targets) {
      field.validating = true;
    }
    this.#notifyChange(formId, "validate", changedPath);

    const fieldErrors = await this.#collectFieldErrors(
      form,
      targets,
      controller.signal,
      generation,
      trigger
    );
    if (fieldErrors === null) {
      return false;
    }

    const adapterResult = await runValidationAdapter(
      buildFormValidatorsAdapter(form.formValidators, trigger) ?? form.adapter,
      form.values,
      {
        formId,
        fields: Object.fromEntries(
          Object.entries(form.fields).map(([path, field]) => [
            path,
            snapshotField(field, form.values),
          ])
        ),
        signal: controller.signal,
      }
    );

    if (!form.validationGuard.isCurrent(generation)) {
      return false;
    }

    this.#applyValidationResults(form, fieldErrors, adapterResult, trigger);
    this.#notifyChange(formId, "validate", changedPath);
    return (
      !Object.values(form.fields).some((field) => field.errors.length > 0) &&
      form.formErrors.length === 0
    );
  }

  #validationTargets(
    form: InternalForm,
    changedPath: FieldPath | undefined,
    trigger: ValidationTrigger
  ): InternalField[] {
    return Object.values(form.fields).filter((field) =>
      this.#shouldValidateField(field, changedPath, trigger, form.validateOn)
    );
  }

  #shouldValidateField(
    field: InternalField,
    changedPath: FieldPath | undefined,
    trigger: ValidationTrigger,
    validateOn: InternalForm["validateOn"]
  ): boolean {
    if (this.#hasTriggerValidator(field, trigger)) {
      return !changedPath || field.path === changedPath;
    }

    if (field.validator && trigger === "onSubmit") {
      return !changedPath || field.path === changedPath || validateOn === "submit";
    }

    if (!changedPath) {
      return Boolean(field.validator);
    }

    return this.#matchesLegacyValidateOn(field.path, changedPath, trigger, validateOn);
  }

  #matchesLegacyValidateOn(
    path: FieldPath,
    changedPath: FieldPath,
    trigger: ValidationTrigger,
    validateOn: InternalForm["validateOn"]
  ): boolean {
    if (validateOn === "change" && trigger === "onChange") {
      return path === changedPath;
    }
    if (validateOn === "blur" && trigger === "onBlur") {
      return path === changedPath;
    }
    return validateOn === "submit" && trigger === "onSubmit";
  }

  async #collectFieldErrors(
    form: InternalForm,
    targets: InternalField[],
    signal: AbortSignal,
    generation: number,
    trigger: ValidationTrigger
  ): Promise<Record<FieldPath, { messages: string[]; trigger: ValidationTrigger }> | null> {
    const fieldErrors: Record<FieldPath, { messages: string[]; trigger: ValidationTrigger }> = {};

    for (const field of targets) {
      const validator =
        buildTriggerValidator(field.validators, trigger) ??
        (trigger === "onSubmit" ? field.validator : undefined);

      if (!validator) {
        continue;
      }

      const messages = await runFieldValidator(validator, getValueAtPath(form.values, field.path), {
        path: field.path,
        values: form.values,
        signal,
      });
      if (!form.validationGuard.isCurrent(generation)) {
        return null;
      }
      if (messages.length > 0) {
        fieldErrors[field.path] = { messages: [...messages], trigger };
      }
    }

    return fieldErrors;
  }

  #applyValidationResults(
    form: InternalForm,
    fieldErrors: Record<FieldPath, { messages: string[]; trigger: ValidationTrigger }>,
    adapterResult: Awaited<ReturnType<typeof runValidationAdapter>>,
    trigger: ValidationTrigger
  ): void {
    if (adapterResult.fieldErrors) {
      for (const [path, messages] of Object.entries(adapterResult.fieldErrors)) {
        fieldErrors[path] = { messages: [...messages], trigger };
      }
    }

    form.formErrors = adapterResult.formErrors ? [...adapterResult.formErrors] : [];
    if (adapterResult.formErrors?.[0]) {
      form.formErrorMap[trigger] = adapterResult.formErrors[0];
    } else if (trigger in form.formErrorMap) {
      const { [trigger]: _removed, ...rest } = form.formErrorMap;
      form.formErrorMap = rest;
    }

    for (const field of Object.values(form.fields)) {
      const entry = fieldErrors[field.path];
      if (entry) {
        field.errors = entry.messages;
        field.errorMap[entry.trigger] = entry.messages[0];
      } else {
        field.errors = [];
        if (trigger in field.errorMap) {
          const { [trigger]: _removed, ...rest } = field.errorMap;
          field.errorMap = rest;
        }
      }
      field.validating = false;
    }
  }

  #notifyChange(formId: string, source: FormChangeSource, fieldPath?: FieldPath): void {
    this.emit("change", { formId, source, fieldPath });
  }
}

/** Factory for a new {@link FormController}. */
export function createFormController(config: FormStoreConfig = {}, id?: string): FormController {
  return new FormController(config, id);
}
