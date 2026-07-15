/**
 * Puppy entrypoint — minimal boolean toggle for the common case.
 */

export type { BaseToggle } from "./internal/base-types.js";
export type {
  PuppyToggleInstance,
  PuppyTogglePluginCallback,
  PuppyTogglePluginOptions,
} from "./variants/puppy/index.js";
export {
  createPuppyToggle,
  PuppyToggle,
  puppyTogglePlugin,
  puppyTogglePlugin as default,
} from "./variants/puppy/index.js";
