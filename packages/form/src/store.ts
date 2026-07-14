/**
 * Store factory for `@ailuracode/alpine-form`.
 */

import { FormController } from "./controller.js";
import type { FormInstance, FormStore, FormStoreConfig } from "./types.js";

function syncInstances(target: Record<string, FormInstance>, controller: FormController): void {
  syncInstanceRegistry(target, controller.snapshotInstances());
}

export function syncInstanceRegistry<T extends Record<string, FormInstance>>(
  target: Record<string, FormInstance>,
  snapshot: T
): void {
  for (const key of Object.keys(snapshot)) {
    target[key] = snapshot[key];
  }
  for (const key of Object.keys(target)) {
    if (!(key in snapshot)) {
      Reflect.deleteProperty(target, key);
    }
  }
}

/** Builds a {@link FormStore} backed by a new {@link FormController}. */
export function createFormStore(config: FormStoreConfig = {}): FormStore {
  return createFormStoreFromController(new FormController(config));
}

/** Builds a {@link FormStore} that mirrors the given controller. */
export function createFormStoreFromController(controller: FormController): FormStore {
  const instances: Record<string, FormInstance> = {};
  const sync = () => {
    syncInstances(instances, controller);
  };

  const store: FormStore = {
    instances,
    register: (id, options) => {
      controller.register(id, options);
    },
    unregister: (id) => {
      controller.unregister(id);
    },
    registerField: (formId, path, options) => {
      controller.registerField(formId, path, options);
    },
    unregisterField: (formId, path) => {
      controller.unregisterField(formId, path);
    },
    setValue: (formId, path, value) => {
      controller.setValue(formId, path, value);
    },
    getValue: (formId, path) => controller.getValue(formId, path),
    touch: (formId, path) => {
      controller.touch(formId, path);
    },
    validate: (formId) => controller.validate(formId),
    submit: (formId, handler) => controller.submit(formId, handler),
    reset: (formId, options) => {
      controller.reset(formId, options);
    },
    setServerErrors: (formId, errors, formErrors) => {
      controller.setServerErrors(formId, errors, formErrors);
    },
    fieldProps: (formId, path, options) => controller.fieldProps(formId, path, options),
    focusFirstError: (formId, root) => controller.focusFirstError(formId, root),
    announceErrors: (formId, liveRegion) => controller.announceErrors(formId, liveRegion),
    destroy: () => {
      controller.destroy();
    },
  };

  controller.on("change", sync);
  controller.on("submit", sync);
  controller.on("submit-error", sync);

  return store;
}
