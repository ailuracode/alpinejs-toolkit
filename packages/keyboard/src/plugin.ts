import type AlpineType from "alpinejs";
import { createKeyboard, type KeyboardController } from "./controller.js";
import type {
  KeyboardMagic,
  KeyboardPluginOptions,
  KeyboardShortcutDefinition,
  KeyboardStore,
  ShortcutHandler,
  ShortcutRegistrationOptions,
  ShortcutScope,
} from "./types.js";

interface KeyboardAlpine extends AlpineType.Alpine {
  cleanup?(callback: () => void): void;
}

const KEYBOARD_STORE_KEY = "keyboard";

function createKeyboardStore(controller: KeyboardController): KeyboardStore {
  const store: KeyboardStore = {
    get activeScopes() {
      return controller.activeScopes;
    },

    get suspendedScopes() {
      return controller.suspendedScopes;
    },

    get commands() {
      return controller.commands;
    },

    register(shortcut: string, handler: ShortcutHandler, options?: ShortcutRegistrationOptions) {
      return controller.register(shortcut, handler, options);
    },

    unregister(id: string) {
      return controller.unregister(id);
    },

    activateScope(scope: ShortcutScope) {
      controller.activateScope(scope);
    },

    deactivateScope(scope: ShortcutScope) {
      controller.deactivateScope(scope);
    },

    suspendScope(scope: ShortcutScope) {
      controller.suspendScope(scope);
    },

    resumeScope(scope: ShortcutScope) {
      controller.resumeScope(scope);
    },

    isScopeActive(scope: ShortcutScope) {
      return controller.isScopeActive(scope);
    },

    isScopeSuspended(scope: ShortcutScope) {
      return controller.isScopeSuspended(scope);
    },

    handleKeydown(event: KeyboardEvent) {
      controller.handleKeydown(event);
    },
  };

  return store;
}

function registerInitialShortcuts(
  controller: KeyboardController,
  shortcuts: readonly KeyboardShortcutDefinition[]
): void {
  for (const entry of shortcuts) {
    controller.register(entry.shortcut, entry.handler, entry.options);
  }
}

function registerKeyboard(
  Alpine: KeyboardAlpine,
  options: KeyboardPluginOptions = {}
): KeyboardController {
  const controller = options.controller ?? createKeyboard(options.options);
  registerInitialShortcuts(controller, options.shortcuts ?? []);

  if (!controller.isMounted) {
    controller.mount();
  }

  Alpine.store(KEYBOARD_STORE_KEY, createKeyboardStore(controller));
  const reactiveStore = Alpine.store(KEYBOARD_STORE_KEY) as KeyboardStore;

  Alpine.magic(KEYBOARD_STORE_KEY, () => reactiveStore as KeyboardMagic);

  if (typeof Alpine.cleanup === "function") {
    Alpine.cleanup(() => {
      controller.destroy();
    });
  }

  return controller;
}

/** Alpine.js keyboard plugin. Registers `$store.keyboard` and `$keyboard`. */
export function keyboardPlugin(
  options: KeyboardPluginOptions
): (Alpine: AlpineType.Alpine) => KeyboardController;
export function keyboardPlugin(Alpine: AlpineType.Alpine): void;
export function keyboardPlugin(
  optionsOrAlpine?: KeyboardPluginOptions | AlpineType.Alpine
): undefined | ((Alpine: AlpineType.Alpine) => KeyboardController) {
  if (optionsOrAlpine && typeof (optionsOrAlpine as AlpineType.Alpine).magic === "function") {
    registerKeyboard(optionsOrAlpine as KeyboardAlpine, {});
    return;
  }

  const options = (optionsOrAlpine as KeyboardPluginOptions | undefined) ?? {};

  return (Alpine: AlpineType.Alpine) => {
    return registerKeyboard(Alpine as KeyboardAlpine, options);
  };
}

export default keyboardPlugin;
