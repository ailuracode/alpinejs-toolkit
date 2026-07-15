import { createToggle } from "@ailuracode/alpine-toggle";
import type { AlpineInstance } from "../types/alpine.js";

/**
 * Standalone-API demo factories. The `ToggleDemo.astro` template
 * already showcases the `$toggle` magic directly via `x-data` —
 * these factories cover the `createToggle()` path documented in the
 * README's "Standalone usage" section so the demo exercises both
 * integration modes (Alpine magic + framework-agnostic controller).
 */

type YesNo = "yes" | "no";
type YesNoUnknown = YesNo | "unknown";

type StandaloneBinaryData = {
  power: YesNo;
  isOn: boolean;
  controller: ReturnType<typeof createToggle<"yes", "no">> | null;
  cycle(): void;
  reset(): void;
  init(): void;
};

type StandaloneTernaryData = {
  answer: YesNoUnknown;
  isUnknown: boolean;
  controller: ReturnType<typeof createToggle<"yes", "no", "unknown">> | null;
  cycle(): void;
  reset(): void;
  init(): void;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "toggleStandaloneDemo",
    (): StandaloneBinaryData => ({
      power: "no",
      isOn: false,
      controller: null,
      init(this: StandaloneBinaryData) {
        const controller = createToggle<"yes", "no">({
          states: { on: "yes", off: "no" },
          initial: "no",
        });
        controller.mount();

        // Subscribe to the controller's typed `change` event and mirror
        // the value onto the Alpine data fields. This is the same
        // bridge pattern the plugin uses internally to keep its facade
        // in sync — see `internal/reactive-adapter.ts` for the
        // Alpine-side equivalent.
        controller.on("change", (detail) => {
          // `detail.current` carries the controller's wide union
          // (`TA | TB | TN`); for this binary case TN is `undefined`,
          // so we narrow to the typed value the Alpine field expects.
          this.power = detail.current as YesNo;
          this.isOn = detail.current === "yes";
        });

        this.controller = controller;
      },
      cycle(this: StandaloneBinaryData) {
        this.controller?.toggle();
      },
      reset(this: StandaloneBinaryData) {
        this.controller?.reset();
      },
    })
  );

  Alpine.data(
    "toggleStandaloneTernaryDemo",
    (): StandaloneTernaryData => ({
      answer: "unknown",
      isUnknown: true,
      controller: null,
      init(this: StandaloneTernaryData) {
        const controller = createToggle<"yes", "no", "unknown">({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        });
        controller.mount();

        controller.on("change", (detail) => {
          this.answer = detail.current;
          this.isUnknown = detail.current === "unknown";
        });

        this.controller = controller;
      },
      cycle(this: StandaloneTernaryData) {
        this.controller?.toggle();
      },
      reset(this: StandaloneTernaryData) {
        this.controller?.reset();
      },
    })
  );
}
