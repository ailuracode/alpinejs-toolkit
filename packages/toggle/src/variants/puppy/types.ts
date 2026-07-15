import type { PluginCallback } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";
import type { BaseToggle } from "../../internal/base-types.js";

/** Boolean-only toggle instance returned by {@link createPuppyToggle}. */
export interface PuppyToggleInstance extends BaseToggle<boolean> {}

/** Options accepted by the {@link puppyTogglePlugin} factory. */
export interface PuppyTogglePluginOptions {
  readonly id?: string;
}

/** `Alpine.plugin()` callback signature for the Puppy variant. */
export type PuppyTogglePluginCallback = PluginCallback<AlpineBase>;
