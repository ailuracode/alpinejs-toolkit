/**
 * Alpine.js integration for the Puppy toggle variant.
 *
 * Registers `$toggle(initial?)` — a boolean factory with no state
 * configuration object.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { createPuppyToggle } from "./controller.js";
import type { PuppyTogglePluginCallback, PuppyTogglePluginOptions } from "./types.js";

interface PuppyToggleAlpine {
  reactive<T>(value: T): T;
  magic(name: string, factory: () => unknown): void;
}

const TOGGLE_MAGIC_KEY = "toggle";

export function puppyTogglePlugin(
  options: PuppyTogglePluginOptions = {}
): PuppyTogglePluginCallback {
  return function registerPuppyToggle(alpine: AlpineBase): void {
    const Alpine = alpine as unknown as PuppyToggleAlpine;

    const factory = (initial?: boolean) => Alpine.reactive(createPuppyToggle(initial ?? false));

    Alpine.magic(TOGGLE_MAGIC_KEY, () => factory);
    void options;
  };
}
