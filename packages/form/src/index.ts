/**
 * Public entrypoint for `@ailuracode/alpine-form`.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
export {
  announceFormErrors,
  buildErrorAnnouncement,
  createFieldAriaProps,
  focusFirstInvalidField,
} from "./accessibility.js";
export { createFormController, FormController } from "./controller.js";
export { createForm, createFormOptions } from "./create-form.js";
export { FormError, type FormErrorCode, isFormErrorCode } from "./error.js";
export type { FormEvents } from "./events.js";
export { type JsonApiErrorLike, mapJsonApiErrors, pointerToFieldPath } from "./json-api-errors.js";
export {
  deleteValueAtPath,
  getValueAtPath,
  normalizePath,
  parsePathSegments,
  setValueAtPath,
  splitPath,
  valuesEqual,
} from "./paths.js";
export {
  type FormPluginOptions,
  formOptions,
  formPlugin,
  formPlugin as default,
} from "./plugin.js";
export {
  createStandardSchemaAdapter,
  isStandardSchema,
  issuePathToFieldPath,
  parseFieldWithStandardSchema,
  type StandardSchemaIssue,
  type StandardSchemaResult,
  type StandardSchemaV1,
  standardSchemaIssuesToFieldErrors,
  validateStandardSchema,
} from "./standard-schema.js";
export { createFormStore, createFormStoreFromController, syncInstanceRegistry } from "./store.js";
export type {
  CreateFormApiOptions,
  CreateFormOptions,
  FieldApi,
  FieldApiState,
  FieldMeta,
  FieldPath,
  FieldPropsOptions,
  FieldRegistrationOptions,
  FieldState,
  FieldValidationContext,
  FieldValidator,
  FieldValidators,
  FormAlpine,
  FormApi,
  FormApiState,
  FormChangeDetail,
  FormChangeSource,
  FormInstance,
  FormInstanceOptions,
  FormPluginCallback,
  FormResetOptions,
  FormStore,
  FormStoreConfig,
  FormSubmitContext,
  FormSubmitDetail,
  FormSubmitErrorDetail,
  FormSubmitHandler,
  FormValidateOn,
  FormValidationContext,
  FormValidatorFn,
  FormValidatorMessage,
  FormValidatorObjectResult,
  FormValidatorResult,
  FormValidators,
  ServerFieldErrors,
  ValidationAdapter,
  ValidationResult,
  ValidationTrigger,
} from "./types.js";
// --- Public constants ------------------------------------------------
export {
  DEFAULT_FORM_MAGIC_KEY,
  DEFAULT_FORM_STORE_KEY,
} from "./types.js";
export {
  composeValidationAdapters,
  createFieldValidatorsAdapter,
  runFieldValidator,
  runValidationAdapter,
} from "./validation.js";
export {
  buildFormValidatorsAdapter,
  buildTriggerValidator,
  composeFormValidatorsAdapter,
  isValidatorFn,
  runFormValidatorSource,
  runValidatorSource,
} from "./validators-runtime.js";
