import { guardMagic } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import { ToggleController } from "./controller";
import type {
  CreateToggleOptions,
  ToggleAlpine,
  ToggleOptions,
  TogglePluginCallback,
  ToggleReactiveView,
  ToggleReactiveViewValue,
} from "./types";

export function togglePlugin(options: CreateToggleOptions = {}): TogglePluginCallback {
  const magicKey = options.magicKey ?? "toggle";

  return function registerToggle(alpine: Alpine): void {
    const host = alpine as unknown as ToggleAlpine;
    const teardown: (() => void)[] = [];

    const factory = <TA, TB, TN>(
      opts: ToggleOptions<TA, TB, TN>
    ): ToggleReactiveView<TA, TB, TN> => {
      const controller = new ToggleController<TA, TB, TN, ToggleReactiveViewValue<TA, TB, TN>>(
        opts
      );
      controller.mount();
      let reactive: ToggleReactiveView<TA, TB, TN>;
      const view: Record<string, unknown> = {
        id: controller.id,
        isMounted: () => controller.isMounted,
        isDestroyed: () => controller.isDestroyed,
        states: controller.states,
        is: (v: ToggleReactiveViewValue<TA, TB, TN>) => controller.is(v),
        set: (v: ToggleReactiveViewValue<TA, TB, TN>) => controller.set(v),
        toggle: () => controller.toggle(),
        next: () => controller.next(),
        reset: () => controller.reset(),
        setSilently(v: ToggleReactiveViewValue<TA, TB, TN>) {
          controller.setSilently(v);
          reactive.value = v;
        },
      };
      reactive = host.reactive(view) as unknown as ToggleReactiveView<TA, TB, TN>;
      reactive.value = controller.value;
      teardown.push(
        controller.on("change", (detail) => {
          reactive.value = detail.current as ToggleReactiveViewValue<TA, TB, TN>;
        }),
        () => controller.destroy()
      );
      return reactive;
    };

    guardMagic(host, magicKey, () => factory, "toggle");

    if (typeof host.cleanup === "function") {
      host.cleanup(() => {
        for (const fn of teardown) {
          fn();
        }
        teardown.length = 0;
      });
    }
  };
}

export function createToggle<TA, TB>(
  options: ToggleOptions<TA, TB, undefined>
): ToggleController<TA, TB, undefined, TA | TB>;

export function createToggle<TA, TB, TN>(
  options: ToggleOptions<TA, TB, TN>
): ToggleController<TA, TB, TN, TA | TB | TN>;

export function createToggle<TA, TB, TN>(
  options: ToggleOptions<TA, TB, TN>
): ToggleController<TA, TB, TN, TA | TB | TN> {
  const controller = new ToggleController<TA, TB, TN, TA | TB | TN>(options);
  controller.mount();
  return controller;
}
