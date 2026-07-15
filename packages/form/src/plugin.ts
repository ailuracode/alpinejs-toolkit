/**
 * Alpine.js integration for `@ailuracode/alpine-form`.
 */

import { bridgeControllerStore } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import { FormController } from "./controller.js";
import { normalizeFormPluginOptions } from "./options.js";
import { createFormStoreFromController, syncInstanceRegistry } from "./store.js";
import {
  type CreateFormOptions,
  DEFAULT_FORM_MAGIC_KEY,
  DEFAULT_FORM_STORE_KEY,
  type FormAlpine,
  type FormPluginCallback,
  type FormStore,
} from "./types.js";

/** Plugin factory — returns the `Alpine.plugin()` callback. */
export function formPlugin(options: CreateFormOptions = {}): FormPluginCallback {
  // Resolve the registration keys once. The magic follows the store
  // so renames stay in sync: a single `storeKey` is enough when both
  // must move out of a collided name.
  const storeKey = options.storeKey ?? DEFAULT_FORM_STORE_KEY;
  const magicKey = options.magicKey ?? options.storeKey ?? DEFAULT_FORM_MAGIC_KEY;

  return function registerForm(alpine: Alpine): void {
    const Alpine = alpine as unknown as FormAlpine;
    const normalized = normalizeFormPluginOptions(options);
    const controller = new FormController(
      { defaultValidateOn: normalized.defaultValidateOn },
      normalized.id
    );
    const store = createFormStoreFromController(controller);

    bridgeControllerStore<FormStore, FormController>({
      alpine: Alpine,
      storeKey,
      magicKey,
      store,
      controller,
      packageName: "form",
      subscribe: (reactiveStore) => {
        const syncReactiveInstances = (): void => {
          syncInstanceRegistry(reactiveStore.instances, controller.snapshotInstances());
        };

        const changeUnsub = controller.on("change", syncReactiveInstances);
        const submitUnsub = controller.on("submit", syncReactiveInstances);
        const submitErrorUnsub = controller.on("submit-error", syncReactiveInstances);

        return (): void => {
          changeUnsub();
          submitUnsub();
          submitErrorUnsub();
        };
      },
    });
  };
}

export { formOptions } from "./options.js";

/** @deprecated Use `CreateFormOptions` instead. */
export type FormPluginOptions = CreateFormOptions;

export { formPlugin as default };
