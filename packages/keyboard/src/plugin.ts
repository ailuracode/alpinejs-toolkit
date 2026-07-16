import type AlpineType from "alpinejs";
import { createKeyboard, type KeyboardController } from "./controller.js";
import type { Alpine } from "./core-deps.js";
import { bridgeControllerStore } from "./core-deps.js";
import type {
  KeyboardPluginOptions,
  KeyboardShortcutDefinition,
  KeyboardStore,
  ShortcutHandler,
  ShortcutRegistrationOptions,
  ShortcutScope,
} from "./types.js";
import { DEFAULT_KEYBOARD_MAGIC_KEY, DEFAULT_KEYBOARD_STORE_KEY } from "./types.js";

type KeyboardAlpine = Alpine<{ keyboard: KeyboardStore }> & {
  cleanup?(callback: () => void): void;
};

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
  alpine: AlpineType.Alpine,
  options: KeyboardPluginOptions = {}
): KeyboardController {
  // Resolve the registration keys once. The magic follows the store
  // so renames stay in sync: a single `storeKey` is enough when both
  // must move out of a collided name.
  const storeKey = options.storeKey ?? DEFAULT_KEYBOARD_STORE_KEY;
  const magicKey = options.magicKey ?? options.storeKey ?? DEFAULT_KEYBOARD_MAGIC_KEY;

  const Alpine = alpine as unknown as KeyboardAlpine;
  const controller = options.controller ?? createKeyboard(options.options);
  registerInitialShortcuts(controller, options.shortcuts ?? []);

  if (!controller.isMounted) {
    controller.mount();
  }

  bridgeControllerStore<KeyboardStore, KeyboardController>({
    alpine: Alpine,
    storeKey,
    magicKey,
    store: createKeyboardStore(controller),
    controller,
    packageName: "keyboard",
  });

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
    registerKeyboard(optionsOrAlpine as AlpineType.Alpine, {});
    return;
  }

  const options = (optionsOrAlpine as KeyboardPluginOptions | undefined) ?? {};

  return (Alpine: AlpineType.Alpine) => {
    return registerKeyboard(Alpine, options);
  };
}

export default keyboardPlugin;
