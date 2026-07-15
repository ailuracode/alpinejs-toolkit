import * as Doggo from "@ailuracode/alpine-toggle/doggo";
import * as Puppy from "@ailuracode/alpine-toggle/puppy";
import type { AlpineInstance } from "../types/alpine.js";

type FilterState = "enabled" | "disabled" | "mixed";

type TogglePuppyDemoData = {
  value: boolean;
  init(): void;
  flip(): boolean;
  set(on: boolean): void;
};

type ToggleDoggoDemoData = {
  value: FilterState;
  lastChange: string;
  init(): void;
  flip(): FilterState;
  next(): FilterState;
  reset(): FilterState;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "togglePuppyDemo",
    (): TogglePuppyDemoData => ({
      value: false,
      init(this: TogglePuppyDemoData) {
        this._controller = Puppy.createToggle(false);
        this.value = this._controller.value;
      },
      flip(this: TogglePuppyDemoData & { _controller: ReturnType<typeof Puppy.createToggle> }) {
        this.value = this._controller.toggle();
        return this.value;
      },
      set(this: TogglePuppyDemoData & { _controller: ReturnType<typeof Puppy.createToggle> }, on) {
        this._controller.set(on);
        this.value = this._controller.value;
      },
    })
  );

  Alpine.data(
    "toggleDoggoDemo",
    (): ToggleDoggoDemoData => ({
      value: "mixed",
      lastChange: "",
      init(this: ToggleDoggoDemoData) {
        this._controller = Doggo.createToggle({
          states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
          initial: "mixed",
        });
        this.value = this._controller.value;
        this._controller.onChange(({ current, previous }) => {
          this.value = current;
          this.lastChange = `${String(previous)} → ${String(current)}`;
        });
      },
      flip(this: ToggleDoggoDemoData & { _controller: ReturnType<typeof Doggo.createToggle> }) {
        this.value = this._controller.toggle();
        return this.value;
      },
      next(this: ToggleDoggoDemoData & { _controller: ReturnType<typeof Doggo.createToggle> }) {
        this.value = this._controller.next();
        return this.value;
      },
      reset(this: ToggleDoggoDemoData & { _controller: ReturnType<typeof Doggo.createToggle> }) {
        this.value = this._controller.reset();
        return this.value;
      },
    })
  );
}
