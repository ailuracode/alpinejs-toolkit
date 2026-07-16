/**
 * Public entrypoint for `@ailuracode/alpine-form`.
 */

export {
  announceFormErrors,
  buildErrorAnnouncement,
  createFieldAriaProps,
  focusFirstInvalidField,
} from "./accessibility.js";
export { createFormController, FormController } from "./controller.js";
export type { Unsubscribe } from "./core-deps.js";
export { createForm, createFormOptions } from "./create-form.js";
export { FormError, type FormErrorCode, isFormErrorCode } from "./error.js";
export type { FormEvents } from "./events.js";
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
