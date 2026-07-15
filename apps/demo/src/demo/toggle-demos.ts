import * as BigDog from "@ailuracode/alpine-toggle";
import * as Doggo from "@ailuracode/alpine-toggle/doggo";
import * as Puppy from "@ailuracode/alpine-toggle/puppy";
import type { AlpineInstance } from "../types/alpine.js";
import {
  type BooleanToggleView,
  bridgeBooleanToggle,
  bridgeStatefulToggle,
  type StatefulToggleView,
} from "./toggle-demo-view.js";

type ToggleDemoData = {
  toggle: BooleanToggleView | StatefulToggleView<unknown> | null;
  init(): void;
};

type DoggoToggleDemoData = ToggleDemoData & {
  lastChange: string;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "togglePuppyDemo",
    (): ToggleDemoData => ({
      toggle: null,
      init(this: ToggleDemoData) {
        const controller = Puppy.createToggle(false);
        this.toggle = bridgeBooleanToggle(controller);
      },
    })
  );

  Alpine.data(
    "toggleDoggoDemo",
    (): DoggoToggleDemoData => ({
      toggle: null,
      lastChange: "",
      init(this: DoggoToggleDemoData) {
        const controller = Doggo.createToggle({
          states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
          initial: "mixed",
        });

        controller.onChange(({ current, previous }) => {
          this.lastChange = `${String(previous)} → ${String(current)}`;
        });

        this.toggle = bridgeStatefulToggle(controller);
      },
    })
  );

  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleDemoData => ({
      toggle: null,
      init(this: ToggleDemoData) {
        const controller = BigDog.createToggle({
          states: { on: "yes", off: "no" },
          initial: "no",
        });
        this.toggle = bridgeStatefulToggle(controller);
      },
    })
  );

  Alpine.data(
    "toggleTernaryDemo",
    (): ToggleDemoData => ({
      toggle: null,
      init(this: ToggleDemoData) {
        const controller = BigDog.createToggle({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        });
        this.toggle = bridgeStatefulToggle(controller);
      },
    })
  );
}
