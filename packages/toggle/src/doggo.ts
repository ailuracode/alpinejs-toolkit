/**
 * Doggo entrypoint — balanced toggle with custom states and
 * lightweight subscriptions.
 */

export type { Unsubscribe } from "@ailuracode/alpine-core";
export type { BaseToggle } from "./internal/base-types.js";
export type { ToggleBinaryStates, ToggleStatesView, ToggleTernaryStates } from "./types.js";
export type {
  DoggoToggleChangeDetail,
  DoggoToggleInstance,
  DoggoToggleOptions,
  DoggoTogglePluginCallback,
  DoggoTogglePluginOptions,
} from "./variants/doggo/index.js";
export {
  createDoggoToggle,
  DoggoToggle,
  doggoTogglePlugin,
  doggoTogglePlugin as default,
} from "./variants/doggo/index.js";
