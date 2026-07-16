/**
 * Alpine.js integration for `@ailuracode/alpine-toggle`.
 *
 * Registers the `$toggle(options)` magic — every call returns an
 * independent reactive facade backed by a `ToggleController`. The
 * controller's `V` generic is bound to `ToggleReactiveViewValue` so
 * `controller.value` already returns the narrowed union the facade
 * exposes; a `change` subscription bridges every controller
 * transition back through Alpine's reactive proxy.
 */

import type { Alpine as AlpineBase } from "alpinejs";
import { ToggleController } from "./controller";
import type { Unsubscribe } from "./core-deps.js";
import { guardMagic } from "./core-deps.js";
import { buildReactiveToggleView, syncReactiveToggleView } from "./internal/reactive-adapter";
import type {
  CreateToggleOptions,
  ToggleAlpine,
  ToggleOptions,
  TogglePluginCallback,
  ToggleReactiveView,
  ToggleReactiveViewValue,
  Writable,
} from "./types";
import { DEFAULT_TOGGLE_MAGIC_KEY } from "./types";

interface RegistryEntry {
  readonly controller: Destroyable;
  readonly cleanups: readonly Unsubscribe[];
}

interface Destroyable {
  destroy(): void;
}

export function togglePlugin(options: CreateToggleOptions = {}): TogglePluginCallback {
  const magicKey = options.magicKey ?? DEFAULT_TOGGLE_MAGIC_KEY;

  return function registerToggle(alpine: AlpineBase): void {
    const Alpine = alpine as unknown as ToggleAlpine;
    const registry = new Map<string, RegistryEntry>();

    const factory = <TA, TB, TN>(
      opts: ToggleOptions<TA, TB, TN>
    ): ToggleReactiveView<TA, TB, TN> => {
      const controller = new ToggleController<TA, TB, TN, ToggleReactiveViewValue<TA, TB, TN>>(
        opts
      );
      controller.mount();

      const raw = buildReactiveToggleView<TA, TB, TN>(controller);
      const reactive = Alpine.reactive(raw) as ToggleReactiveView<TA, TB, TN>;

      const unsubscribe = controller.on("change", (detail) => {
        syncReactiveToggleView<TA, TB, TN>(
          reactive as Writable<ToggleReactiveView<TA, TB, TN>>,
          detail
        );
      });

      registry.set(controller.id, {
        controller,
        cleanups: [unsubscribe],
      });

      return reactive;
    };

    guardMagic(Alpine, magicKey, () => factory, "toggle");

    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => {
        for (const entry of registry.values()) {
          for (let index = entry.cleanups.length - 1; index >= 0; index -= 1) {
            entry.cleanups[index]?.();
          }
          entry.controller.destroy();
        }
        registry.clear();
      });
    }
  };
}

/** Standalone factory — returns the unwrapped controller for non-Alpine consumers. */
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
