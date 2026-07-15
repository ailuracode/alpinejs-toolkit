import { createToggle } from "@ailuracode/alpine-toggle";
import type { AlpineInstance } from "../types/alpine.js";

/**
 * Standalone-API demo factories. The `ToggleDemo.astro` template
 * already showcases the `$toggle` magic directly via `x-data` —
 * these factories cover the `createToggle()` path documented in the
 * README's "Standalone usage" section so the demo exercises both
 * integration modes (Alpine magic + framework-agnostic controller).
 *
 * The controller is held in a closure (NOT as a reactive field on
 * the data scope) because Alpine.reactive wraps nested objects —
 * storing the controller on `this` would cause every method call
 * (`controller.toggle()`, `controller.destroy()`) to run with the
 * Alpine Proxy as `this`, and the controller's private-field
 * accesses (`this.#destroyed`, `this.#value`) would throw because
 * the Proxy is not a ToggleController instance.
 *
 * Instead, the factory subscribes to the controller's `change` event
 * and mirrors the new value onto the Alpine data fields — those
 * writes trigger Alpine's reactive proxy and re-render the bindings.
 * `cycle()` / `reset()` close over the same controller reference.
 */

type YesNo = "yes" | "no";
type YesNoUnknown = YesNo | "unknown";

type StandaloneBinaryData = {
  power: YesNo;
  isOn: boolean;
  cycle(): void;
  reset(): void;
  init(): void;
};

type StandaloneTernaryData = {
  answer: YesNoUnknown;
  isUnknown: boolean;
  cycle(): void;
  reset(): void;
  init(): void;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data("toggleStandaloneDemo", (): StandaloneBinaryData => {
    let controller: ReturnType<typeof createToggle<"yes", "no">> | null = null;
    return {
      power: "no",
      isOn: false,
      init(this: StandaloneBinaryData) {
        controller = createToggle<"yes", "no">({
          states: { on: "yes", off: "no" },
          initial: "no",
        });
        controller.mount();

        // Mirror the controller's `change` event onto the Alpine
        // data fields. Same bridge pattern the plugin uses internally
        // — see `internal/reactive-adapter.ts`.
        controller.on("change", (detail) => {
          // `detail.current` carries the controller's wide union
          // (`TA | TB | TN`); for this binary case TN is `undefined`,
          // so we narrow to the typed value the Alpine field expects.
          this.power = detail.current as YesNo;
          this.isOn = detail.current === "yes";
        });
      },
      cycle() {
        controller?.toggle();
      },
      reset() {
        controller?.reset();
      },
    };
  });

  Alpine.data("toggleStandaloneTernaryDemo", (): StandaloneTernaryData => {
    let controller: ReturnType<typeof createToggle<"yes", "no", "unknown">> | null = null;
    return {
      answer: "unknown",
      isUnknown: true,
      init(this: StandaloneTernaryData) {
        controller = createToggle<"yes", "no", "unknown">({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        });
        controller.mount();

        controller.on("change", (detail) => {
          this.answer = detail.current;
          this.isUnknown = detail.current === "unknown";
        });
      },
      cycle() {
        controller?.toggle();
      },
      reset() {
        controller?.reset();
      },
    };
  });
}
