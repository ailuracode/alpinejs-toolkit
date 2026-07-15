/**
 * Alpine.js integration for `@ailuracode/alpine-toggle`.
 *
 * Thin adapter that exposes `$toggle(options)` as a factory — every
 * call returns an independent reactive shell backed by a
 * {@link ToggleController}. No `$store.*` registration (see `AGENTS.md`
 * for the integration contract).
 */

import { InstanceRegistry } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";
import { ToggleController } from "./controller";
import { bridgeToggleControllerToAlpine } from "./internal/alpine-reactive-adapter.js";
import type {
  CreateToggleOptions,
  ToggleAlpine,
  ToggleInstance,
  ToggleOptions,
  TogglePluginCallback,
} from "./types";

/** Key under which the magic is registered on the Alpine runtime. */
const TOGGLE_MAGIC_KEY = "toggle";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link CreateToggleOptions} to configure {@link ToggleController},
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 */
export function togglePlugin(options: CreateToggleOptions = {}): TogglePluginCallback {
  return function registerToggle(alpine: AlpineBase): void {
    // Narrow the base Alpine runtime to the toolkit's typed view.
    // The cast is the only `as unknown as` in this file — every
    // subsequent call is fully typed against `ToggleAlpine`.
    const Alpine = alpine as unknown as ToggleAlpine;
    const registry = new InstanceRegistry<ToggleController<unknown, unknown, unknown>>();

    /**
     * The magic factory — `$toggle(options)` returns an
     * independent reactive instance every call.
     *
     * Typed as a generic arrow so each call site preserves the
     * consumer's narrowing (`on` / `off` / `indeterminate` types).
     * The factory constructs a fresh controller, mounts it,
     * tracks it for cleanup, and hands Alpine a reactive shell that
     * delegates to the controller.
     */
    const factory = <TA, TB, TN>(
      opts: ToggleOptions<TA, TB, TN>
    ): ToggleInstance<TA, TB, TN, TA | TB | TN> => {
      const controller = new ToggleController<TA, TB, TN, TA | TB | TN>(opts);
      controller.mount();
      registry.register(controller.id, controller as ToggleController<unknown, unknown, unknown>);
      return bridgeToggleControllerToAlpine(Alpine, controller) as ToggleInstance<
        TA,
        TB,
        TN,
        TA | TB | TN
      >;
    };

    Alpine.magic(TOGGLE_MAGIC_KEY, () => factory);

    // Forward destroy() through Alpine's cleanup mechanism when
    // available. Older Alpine versions don't expose `cleanup` —
    // the guard matches the one used by `@ailuracode/alpine-theme`.
    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => {
        for (const entry of registry.entries()) {
          entry.instance.destroy();
        }
        registry.clear();
      });
    }

    // `options.id` is currently unused at the plugin level — the
    // controller auto-generates its own id. The field is reserved
    // for future cross-cutting configuration (logging hooks,
    // global event sinks, etc.). Reference the parameter to keep
    // the lint rule happy and signal intent.
    void options;
  };
}

/**
 * Standalone factory — builds a {@link ToggleController} without an
 * Alpine runtime. Used by non-Alpine consumers (tests, vanilla TS
 * widgets, server-side rendering) and as the inner factory the
 * plugin's `$toggle` magic invokes.
 *
 * Returns the unwrapped controller — Alpine consumers receive a reactive
 * shell from `$toggle(...)` inside the plugin.
 */
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
