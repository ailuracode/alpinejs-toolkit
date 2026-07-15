/**
 * Doggo entrypoint — balanced toggle with custom states and
 * lightweight subscriptions.
 *
 * Exports mirror the Big Dog surface (`createToggle`, `togglePlugin`,
 * `ToggleController`, …). Alias at import time when using more than one tier.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
export type { ToggleEvents } from "./events.js";
export type {
  ToggleAlpine,
  ToggleBinaryStates,
  ToggleChangeSource,
  ToggleStatesView,
  ToggleTernaryStates,
} from "./types.js";
export {
  createDoggoToggle as createToggle,
  DoggoToggle as ToggleController,
} from "./variants/doggo/controller.js";
export {
  doggoTogglePlugin as default,
  doggoTogglePlugin as togglePlugin,
} from "./variants/doggo/plugin.js";
export type {
  DoggoToggleChangeDetail as ToggleChangeDetail,
  DoggoToggleInstance as ToggleInstance,
  DoggoToggleOptions as ToggleOptions,
  DoggoTogglePluginCallback as TogglePluginCallback,
  DoggoTogglePluginOptions as CreateToggleOptions,
} from "./variants/doggo/types.js";
