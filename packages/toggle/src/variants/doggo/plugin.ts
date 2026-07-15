/**
 * Alpine.js integration for the Doggo toggle variant.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { createDoggoToggle } from "./controller.js";
import type {
  DoggoToggleInstance,
  DoggoToggleOptions,
  DoggoTogglePluginCallback,
  DoggoTogglePluginOptions,
} from "./types.js";

interface DoggoToggleAlpine {
  reactive<T>(value: T): T;
  magic(name: string, factory: () => unknown): void;
}

const TOGGLE_MAGIC_KEY = "toggle";

export function doggoTogglePlugin(
  options: DoggoTogglePluginOptions = {}
): DoggoTogglePluginCallback {
  return function registerDoggoToggle(alpine: AlpineBase): void {
    const Alpine = alpine as unknown as DoggoToggleAlpine;

    const factory = <TA, TB, TN>(
      opts: DoggoToggleOptions<TA, TB, TN>
    ): DoggoToggleInstance<TA, TB, TN, TA | TB | TN> => {
      const controller = createDoggoToggle(opts);
      return Alpine.reactive(controller) as DoggoToggleInstance<TA, TB, TN, TA | TB | TN>;
    };

    Alpine.magic(TOGGLE_MAGIC_KEY, () => factory);
    void options;
  };
}
