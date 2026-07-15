import type { ToggleInstance } from "@ailuracode/alpine-toggle";
import * as Doggo from "@ailuracode/alpine-toggle/doggo";
import * as Puppy from "@ailuracode/alpine-toggle/puppy";
import {
  bridgeBooleanToggleToAlpine,
  bridgeDoggoToggleToAlpine,
} from "../../../../packages/toggle/src/internal/alpine-reactive-adapter.js";
import type { AlpineInstance } from "../types/alpine.js";

type ToggleMagic = <TA, TB, TN>(
  options: import("@ailuracode/alpine-toggle").ToggleOptions<TA, TB, TN>
) => ToggleInstance<TA, TB, TN, TA | TB | TN>;

type TogglePuppyDemoData = {
  toggle: ToggleInstance | null;
  init(): void;
};

type ToggleDoggoDemoData = {
  toggle: ToggleInstance<string, string, string, string> | null;
  init(): void;
};

type ToggleBinaryDemoData = {
  toggle: ToggleInstance<"yes", "no", undefined, "yes" | "no"> | null;
  init(): void;
};

type ToggleTernaryDemoData = {
  toggle: ToggleInstance<"yes", "no", "unknown", "yes" | "no" | "unknown"> | null;
  init(): void;
};

type ToggleDemoComponent = {
  $toggle: ToggleMagic;
};

function createPuppyToggleView(Alpine: AlpineInstance) {
  return bridgeBooleanToggleToAlpine(Alpine, Puppy.createToggle(false));
}

function createDoggoToggleView(Alpine: AlpineInstance) {
  return bridgeDoggoToggleToAlpine(
    Alpine,
    Doggo.createToggle({
      states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
      initial: "mixed",
    })
  );
}

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "togglePuppyDemo",
    (): TogglePuppyDemoData => ({
      toggle: null,
      init(this: TogglePuppyDemoData) {
        this.toggle = createPuppyToggleView(Alpine);
      },
    })
  );

  Alpine.data(
    "toggleDoggoDemo",
    (): ToggleDoggoDemoData => ({
      toggle: null,
      init(this: ToggleDoggoDemoData) {
        this.toggle = createDoggoToggleView(Alpine);
      },
    })
  );

  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleBinaryDemoData => ({
      toggle: null,
      init(this: ToggleBinaryDemoData & ToggleDemoComponent) {
        this.toggle = this.$toggle({
          states: { on: "yes", off: "no" },
          initial: "no",
        });
      },
    })
  );

  Alpine.data(
    "toggleTernaryDemo",
    (): ToggleTernaryDemoData => ({
      toggle: null,
      init(this: ToggleTernaryDemoData & ToggleDemoComponent) {
        this.toggle = this.$toggle({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        });
      },
    })
  );
}
