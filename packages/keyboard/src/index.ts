export type {
  KeyboardOptions,
  ShortcutRegistration,
  ShortcutRegistrationOptions,
  ShortcutScope,
} from "./controller.js";
export {
  createKeyboard,
  KeyboardController,
} from "./controller.js";
export type { KeyboardErrorCode } from "./errors.js";
export { KeyboardError } from "./errors.js";
export { formatShortcut, parseShortcut } from "./parse.js";
export { keyboardPlugin, keyboardPlugin as default } from "./plugin.js";
export type {
  KeyboardMagic,
  KeyboardPluginOptions,
  KeyboardShortcutDefinition,
  KeyboardStore,
  ShortcutHandler,
  ShortcutMetadata,
} from "./types.js";
