import { createDoggoToggle } from "@ailuracode/alpine-toggle/doggo";
import { createPuppyToggle } from "@ailuracode/alpine-toggle/puppy";
import type { AlpineInstance } from "../types/alpine.js";

type PuppyLamp = ReturnType<typeof createPuppyToggle>;

type DoggoFilter = ReturnType<typeof createDoggoToggle<"enabled", "disabled", "mixed">>;

type TogglePuppyDemoData = {
  lamp: PuppyLamp;
};

type ToggleDoggoDemoData = {
  filter: DoggoFilter;
  lastChange: string;
  init(): void;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "togglePuppyDemo",
    (): TogglePuppyDemoData => ({
      lamp: Alpine.reactive(createPuppyToggle(false)),
    })
  );

  Alpine.data(
    "toggleDoggoDemo",
    (): ToggleDoggoDemoData => ({
      filter: Alpine.reactive(
        createDoggoToggle({
          states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
          initial: "mixed",
        })
      ),
      lastChange: "",
      init(this: ToggleDoggoDemoData) {
        this.filter.onChange(({ current, previous }) => {
          this.lastChange = `${String(previous)} → ${String(current)}`;
        });
      },
    })
  );
}
