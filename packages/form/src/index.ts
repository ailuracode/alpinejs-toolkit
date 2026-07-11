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
export { createFormStore, createFormStoreFromController, syncInstanceRegistry } from "./store.js";
export type {
  CreateFormOptions,
  FieldPath,
  FieldPropsOptions,
  FieldRegistrationOptions,
  FieldState,
  FieldValidationContext,
  FieldValidator,
  FormAlpine,
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
  ServerFieldErrors,
  ValidationAdapter,
  ValidationResult,
} from "./types.js";
export {
  composeValidationAdapters,
  createFieldValidatorsAdapter,
  runFieldValidator,
  runValidationAdapter,
} from "./validation.js";
