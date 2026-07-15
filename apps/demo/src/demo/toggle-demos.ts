import * as Doggo from "@ailuracode/alpine-toggle/doggo";
import * as Puppy from "@ailuracode/alpine-toggle/puppy";
import type { AlpineInstance } from "../types/alpine.js";

type FilterState = "enabled" | "disabled" | "mixed";

type PuppyToggleView = {
  value: boolean;
  flip(): boolean;
  set(on: boolean): void;
};

type DoggoToggleView = {
  value: FilterState;
  states: { on: FilterState; off: FilterState; indeterminate: FilterState };
  is(candidate: FilterState): boolean;
  flip(): FilterState;
  next(): FilterState;
  reset(): FilterState;
};

type TogglePuppyDemoData = {
  toggle: PuppyToggleView | null;
  init(): void;
};

type ToggleDoggoDemoData = {
  toggle: DoggoToggleView | null;
  lastChange: string;
  init(): void;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "togglePuppyDemo",
    (): TogglePuppyDemoData => ({
      toggle: null,
      init(this: TogglePuppyDemoData) {
        const controller = Puppy.createToggle(false);
        this.toggle = {
          value: controller.value,
          flip: () => {
            const next = controller.toggle();
            if (this.toggle) {
              this.toggle.value = next;
            }
            return next;
          },
          set: (on) => {
            controller.set(on);
            if (this.toggle) {
              this.toggle.value = controller.value;
            }
          },
        };
      },
    })
  );

  Alpine.data(
    "toggleDoggoDemo",
    (): ToggleDoggoDemoData => ({
      toggle: null,
      lastChange: "",
      init(this: ToggleDoggoDemoData) {
        const controller = Doggo.createToggle({
          states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
          initial: "mixed",
        });
        const states = controller.states;
        controller.onChange(({ current, previous }) => {
          if (this.toggle) {
            this.toggle.value = current;
          }
          this.lastChange = `${String(previous)} → ${String(current)}`;
        });
        this.toggle = {
          value: controller.value,
          states,
          is(candidate) {
            return this.value === candidate;
          },
          flip: () => {
            const next = controller.toggle();
            if (this.toggle) {
              this.toggle.value = next;
            }
            return next;
          },
          next: () => {
            const next = controller.next();
            if (this.toggle) {
              this.toggle.value = next;
            }
            return next;
          },
          reset: () => {
            const next = controller.reset();
            if (this.toggle) {
              this.toggle.value = next;
            }
            return next;
          },
        };
      },
    })
  );
}
