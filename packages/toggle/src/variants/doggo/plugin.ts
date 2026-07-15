import type { Alpine as AlpineBase } from "alpinejs";
import { createReactiveView } from "../../internal/reactive-adapter";
import { DoggoToggle as DoggoToggleController } from "./controller";
import type { DoggoReactiveToggle, DoggoValue, ToggleDoggoOptions } from "./types";

type DoggoAlpine = AlpineBase & { cleanup?(callback: () => void): void };
type DoggoPluginCallback = (alpine: AlpineBase) => void;
type Writable<T> = { -readonly [K in keyof T]: T[K] };

export function togglePlugin(
  options?: ToggleDoggoOptions<unknown, unknown, unknown>
): DoggoPluginCallback;
export function togglePlugin(): DoggoPluginCallback {
  return function registerDoggoToggle(alpine: AlpineBase): void {
    const Alpine = alpine as DoggoAlpine;
    const cleanups: Array<() => void> = [];
    const factory = <TA, TB, TN>(
      options: ToggleDoggoOptions<TA, TB, TN>
    ): DoggoReactiveToggle<TA, TB, TN> => {
      const controller = createDoggoToggle(options);
      type View = DoggoReactiveToggle<TA, TB, TN>;
      let reactive: Writable<View>;
      const facade = {
        value: controller.value as DoggoValue<TA, TB, TN>,
        is: (candidate: DoggoValue<TA, TB, TN>) => controller.is(candidate),
        set: (value: DoggoValue<TA, TB, TN>) => controller.set(value),
        toggle: () => controller.toggle(),
        next: () => controller.next(),
        reset: () => controller.reset(),
        onChange(listener: Parameters<View["onChange"]>[0]) {
          const unsubscribe = controller.onChange(listener);
          cleanups.push(unsubscribe);
          return unsubscribe;
        },
      };
      reactive = createReactiveView(Alpine, facade);
      cleanups.push(
        controller.onChange(({ current }) => {
          // biome-ignore lint/suspicious/noAssignInExpressions: keep Doggo within its budget.
          return (reactive.value = current);
        })
      );
      return reactive;
    };

    Alpine.magic("toggle", () => factory);
    Alpine.cleanup?.(() => {
      while (cleanups.length) {
        // biome-ignore lint/style/noNonNullAssertion: the length guard guarantees a callback.
        cleanups.pop()!();
      }
    });
  };
}

export function createDoggoToggle<TA, TB, TN = undefined>(
  options: ToggleDoggoOptions<TA, TB, TN>
): DoggoToggleController<TA, TB, TN, DoggoValue<TA, TB, TN>> {
  return new DoggoToggleController<TA, TB, TN, DoggoValue<TA, TB, TN>>(options);
}
