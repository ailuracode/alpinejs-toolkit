/**
 * Form controller — the framework-agnostic core of
 * `@ailuracode/alpine-form`.
 */

import { BaseController, generateId } from "@ailuracode/alpine-core";
import {
  announceFormErrors,
  buildErrorAnnouncement,
  createFieldAriaProps,
  focusFirstInvalidField,
} from "./accessibility.js";
import { FormError } from "./error.js";
import type { FormEvents } from "./events.js";
import { AsyncGuard } from "./internal/async-guard.js";
import { normalizeFormInstanceOptions, normalizeFormStoreConfig } from "./options.js";
import {
  deleteValueAtPath,
  getValueAtPath,
  normalizePath,
  setValueAtPath,
  valuesEqual,
} from "./paths.js";
import type {
  FieldPath,
  FieldPropsOptions,
  FieldRegistrationOptions,
  FieldState,
  FieldValidator,
  FormChangeSource,
  FormInstance,
  FormInstanceOptions,
  FormResetOptions,
  FormStoreConfig,
  FormSubmitHandler,
  ServerFieldErrors,
  ValidationAdapter,
} from "./types.js";
import { runFieldValidator, runValidationAdapter } from "./validation.js";

interface InternalField {
  path: FieldPath;
  initialValue: unknown;
  dirty: boolean;
  touched: boolean;
  errors: string[];
  validating: boolean;
  validator?: FieldValidator;
}

interface InternalForm {
  values: Record<string, unknown>;
  initialValues: Record<string, unknown>;
  committedValues: Record<string, unknown>;
  fields: Record<FieldPath, InternalField>;
  formErrors: string[];
  validateOn: "change" | "blur" | "submit";
  adapter?: ValidationAdapter;
  submitting: boolean;
  submitted: boolean;
  validationGuard: AsyncGuard;
  submitController: AbortController | null;
  fieldOrder: FieldPath[];
}

function cloneValues(values: Readonly<Record<string, unknown>>): Record<string, unknown> {
  return structuredClone(values);
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
    validating: field.validating,
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
    formErrors: [...form.formErrors],
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
      validateOn: normalized.validateOn,
      adapter: normalized.adapter,
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
      validating: false,
      validator: options.validate,
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

    const { [normalizedPath]: _removed, ...remainingFields } = form.fields;
    form.fields = remainingFields;
    form.fieldOrder = form.fieldOrder.filter((entry) => entry !== normalizedPath);
    deleteValueAtPath(form.values, normalizedPath);

    this.#notifyChange(formId, "unregister", normalizedPath);
  }

  setValue(formId: string, path: FieldPath, value: unknown): void {
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

    if (form.validateOn === "change") {
      void this.#validateForm(formId, form, normalizedPath);
    }
  }

  getValue(formId: string, path: FieldPath): unknown {
    const form = this.#forms[formId];
    if (!form) {
      return undefined;
    }
    return getValueAtPath(form.values, normalizePath(path));
  }

  touch(formId: string, path: FieldPath): void {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#requireForm(formId);
    const normalizedPath = normalizePath(path);
    const field = form.fields[normalizedPath];
    if (!field || field.touched) {
      return;
    }

    field.touched = true;
    this.#notifyChange(formId, "touch", normalizedPath);

    if (form.validateOn === "blur") {
      void this.#validateForm(formId, form, normalizedPath);
    }
  }

  validate(formId: string): Promise<boolean> {
    if (this.isDestroyed) {
      return Promise.resolve(false);
    }

    const form = this.#requireForm(formId);
    return this.#validateForm(formId, form);
  }

  async submit(formId: string, handler: FormSubmitHandler): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    const form = this.#requireForm(formId);
    if (form.submitting) {
      throw new FormError(`Form "${formId}" is already submitting`, "FORM_ALREADY_SUBMITTING");
    }

    const valid = await this.#validateForm(formId, form);
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
    form.submitted = false;
    form.validationGuard.reset();

    for (const field of Object.values(form.fields)) {
      const value = getValueAtPath(form.values, field.path);
      field.initialValue = getValueAtPath(form.initialValues, field.path);
      field.dirty = false;
      field.touched = false;
      field.errors = [];
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
    changedPath?: FieldPath
  ): Promise<boolean> {
    const generation = form.validationGuard.bump();
    const controller = new AbortController();
    const targets = this.#validationTargets(form, changedPath);

    for (const field of targets) {
      field.validating = true;
    }
    this.#notifyChange(formId, "validate", changedPath);

    const fieldErrors = await this.#collectFieldErrors(
      form,
      targets,
      controller.signal,
      generation
    );
    if (fieldErrors === null) {
      return false;
    }

    const adapterResult = await runValidationAdapter(form.adapter, form.values, {
      formId,
      fields: Object.fromEntries(
        Object.entries(form.fields).map(([path, field]) => [
          path,
          snapshotField(field, form.values),
        ])
      ),
      signal: controller.signal,
    });

    if (!form.validationGuard.isCurrent(generation)) {
      return false;
    }

    this.#applyValidationResults(form, fieldErrors, adapterResult);
    this.#notifyChange(formId, "validate", changedPath);
    return (
      !Object.values(form.fields).some((field) => field.errors.length > 0) &&
      form.formErrors.length === 0
    );
  }

  #validationTargets(form: InternalForm, changedPath?: FieldPath): InternalField[] {
    return Object.values(form.fields).filter((field) =>
      this.#shouldValidateField(field.path, changedPath, form.validateOn)
    );
  }

  #shouldValidateField(
    path: FieldPath,
    changedPath: FieldPath | undefined,
    validateOn: InternalForm["validateOn"]
  ): boolean {
    if (!changedPath) {
      return true;
    }
    return path === changedPath || validateOn === "submit";
  }

  async #collectFieldErrors(
    form: InternalForm,
    targets: InternalField[],
    signal: AbortSignal,
    generation: number
  ): Promise<Record<FieldPath, string[]> | null> {
    const fieldErrors: Record<FieldPath, string[]> = {};

    for (const field of targets) {
      if (!field.validator) {
        continue;
      }

      const messages = await runFieldValidator(
        field.validator,
        getValueAtPath(form.values, field.path),
        {
          path: field.path,
          values: form.values,
          signal,
        }
      );
      if (!form.validationGuard.isCurrent(generation)) {
        return null;
      }
      if (messages.length > 0) {
        fieldErrors[field.path] = [...messages];
      }
    }

    return fieldErrors;
  }

  #applyValidationResults(
    form: InternalForm,
    fieldErrors: Record<FieldPath, string[]>,
    adapterResult: Awaited<ReturnType<typeof runValidationAdapter>>
  ): void {
    if (adapterResult.fieldErrors) {
      for (const [path, messages] of Object.entries(adapterResult.fieldErrors)) {
        fieldErrors[path] = [...(fieldErrors[path] ?? []), ...messages];
      }
    }

    form.formErrors = adapterResult.formErrors ? [...adapterResult.formErrors] : [];

    for (const field of Object.values(form.fields)) {
      field.errors = fieldErrors[field.path] ?? [];
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
