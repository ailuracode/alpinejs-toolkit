import type { Alpine as AlpineBase } from "alpinejs";
import { createReactiveView } from "../../internal/reactive-adapter";
import { PuppyToggle as PuppyToggleController } from "./controller";
import type { CreatePuppyOptions, PuppyReactiveToggle } from "./types";

type PuppyAlpine = AlpineBase & { cleanup?(callback: () => void): void };

export function togglePlugin(_options?: CreatePuppyOptions) {
  return function registerPuppyToggle(alpine: AlpineBase): void {
    const Alpine = alpine as PuppyAlpine;
    const registry: PuppyToggleController[] = [];
    const factory = (options: CreatePuppyOptions = {}): PuppyReactiveToggle => {
      const controller = createPuppyToggle(options.initial);
      const facade = {
        value: controller.value,
        set(value: boolean) {
          controller.set(value);
          this.value = controller.value;
        },
        toggle() {
          // biome-ignore lint/suspicious/noAssignInExpressions: keep the minimal facade within budget.
          return (this.value = controller.toggle());
        },
      };
      registry.push(controller);
      return createReactiveView(Alpine, facade);
    };

    Alpine.magic("toggle", () => factory);
    Alpine.cleanup?.(() => (registry.length = 0));
  };
}

export function createPuppyToggle(initial = false): PuppyToggleController {
  return new PuppyToggleController(initial);
}
