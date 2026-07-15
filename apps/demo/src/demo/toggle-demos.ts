import * as BigDog from "@ailuracode/alpine-toggle";
import * as Doggo from "@ailuracode/alpine-toggle/doggo";
import * as Puppy from "@ailuracode/alpine-toggle/puppy";
import type { AlpineInstance } from "../types/alpine.js";

type TogglePuppyDemoData = {
  toggle: ReturnType<typeof Puppy.createToggle> | null;
  init(): void;
};

type ToggleDoggoDemoData = {
  toggle: ReturnType<typeof Doggo.createToggle> | null;
  init(): void;
};

type ToggleBinaryDemoData = {
  toggle: ReturnType<typeof BigDog.createToggle<"yes", "no">> | null;
  init(): void;
};

type ToggleTernaryDemoData = {
  toggle: ReturnType<typeof BigDog.createToggle<"yes", "no", "unknown">> | null;
  init(): void;
};

export function registerToggleDemos(_Alpine: AlpineInstance): void {
  Alpine.data(
    "togglePuppyDemo",
    (): TogglePuppyDemoData => ({
      toggle: null,
      init(this: TogglePuppyDemoData) {
        this.toggle = Puppy.createToggle(false);
      },
    })
  );

  Alpine.data(
    "toggleDoggoDemo",
    (): ToggleDoggoDemoData => ({
      toggle: null,
      init(this: ToggleDoggoDemoData) {
        this.toggle = Doggo.createToggle({
          states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
          initial: "mixed",
        });
      },
    })
  );

  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleBinaryDemoData => ({
      toggle: null,
      init(this: ToggleBinaryDemoData) {
        this.toggle = BigDog.createToggle({
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
      init(this: ToggleTernaryDemoData) {
        this.toggle = BigDog.createToggle({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        });
      },
    })
  );
}
