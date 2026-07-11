/**
 * Options normalization for `@ailuracode/alpine-form`.
 */

import type {
  CreateFormOptions,
  FormInstanceOptions,
  FormStoreConfig,
  FormValidateOn,
} from "./types.js";

const DEFAULT_VALIDATE_ON: FormValidateOn = "submit";

/** Normalizes form plugin options. */
export function normalizeFormPluginOptions(options: CreateFormOptions = {}): CreateFormOptions {
  return {
    id: options.id,
    defaultValidateOn: options.defaultValidateOn ?? DEFAULT_VALIDATE_ON,
  };
}

/** Normalizes controller store configuration. */
export function normalizeFormStoreConfig(config: FormStoreConfig = {}): FormStoreConfig {
  return {
    defaultValidateOn: config.defaultValidateOn ?? DEFAULT_VALIDATE_ON,
  };
}

/** Normalizes per-form instance options. */
export function normalizeFormInstanceOptions(
  options: FormInstanceOptions = {},
  defaults: FormStoreConfig = {}
): Required<Pick<FormInstanceOptions, "validateOn">> &
  Pick<FormInstanceOptions, "initialValues" | "adapter" | "validators"> {
  return {
    initialValues: options.initialValues,
    validateOn: options.validateOn ?? defaults.defaultValidateOn ?? DEFAULT_VALIDATE_ON,
    adapter: options.adapter,
    validators: options.validators,
  };
}

/** Builds typed form plugin options. */
export function formOptions<const T extends CreateFormOptions>(options: T): T {
  return options;
}
