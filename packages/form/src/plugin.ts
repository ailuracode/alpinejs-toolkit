/**
 * Alpine.js integration for `@ailuracode/alpine-form`.
 */

import type { Alpine } from "alpinejs";
import { FormController } from "./controller.js";
import { normalizeFormPluginOptions } from "./options.js";
import { createFormStoreFromController, syncInstanceRegistry } from "./store.js";
import type { CreateFormOptions, FormAlpine, FormPluginCallback } from "./types.js";

const FORM_STORE_KEY = "form";

/** Plugin factory — returns the `Alpine.plugin()` callback. */
export function formPlugin(options: CreateFormOptions = {}): FormPluginCallback {
  return function registerForm(alpine: Alpine): void {
    const Alpine = alpine as unknown as FormAlpine;
    const normalized = normalizeFormPluginOptions(options);
    const controller = new FormController(
      { defaultValidateOn: normalized.defaultValidateOn },
      normalized.id
    );
    const store = createFormStoreFromController(controller);
    Alpine.store(FORM_STORE_KEY, store);
    const reactiveStore = Alpine.store(FORM_STORE_KEY);

    const syncReactiveInstances = () => {
      syncInstanceRegistry(reactiveStore.instances, controller.snapshotInstances());
    };

    controller.on("change", syncReactiveInstances);
    controller.on("submit", syncReactiveInstances);
    controller.on("submit-error", syncReactiveInstances);

    Alpine.magic(FORM_STORE_KEY, () => reactiveStore);

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => controller.destroy());
    }
  };
}

export { formOptions } from "./options.js";

/** @deprecated Use `CreateFormOptions` instead. */
export type FormPluginOptions = CreateFormOptions;

export { formPlugin as default };
