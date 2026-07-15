/**
 * Puppy entrypoint — minimal boolean toggle for the common case.
 *
 * Exports mirror the Big Dog surface (`createToggle`, `togglePlugin`,
 * `ToggleController`, …). Alias at import time when using more than one tier.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
export type { ToggleEvents } from "./events.js";
export type {
  ToggleAlpine,
  ToggleBinaryStates,
  ToggleChangeDetail,
  ToggleChangeSource,
  ToggleOptions,
  ToggleStatesView,
  ToggleTernaryStates,
} from "./types.js";
export {
  createPuppyToggle as createToggle,
  PuppyToggle as ToggleController,
} from "./variants/puppy/controller.js";
export {
  puppyTogglePlugin as default,
  puppyTogglePlugin as togglePlugin,
} from "./variants/puppy/plugin.js";
export type {
  PuppyToggleInstance as ToggleInstance,
  PuppyTogglePluginCallback as TogglePluginCallback,
  PuppyTogglePluginOptions as CreateToggleOptions,
} from "./variants/puppy/types.js";
