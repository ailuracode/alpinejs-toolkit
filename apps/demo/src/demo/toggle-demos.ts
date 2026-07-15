import type { ToggleInstance } from "@ailuracode/alpine-toggle";
import { createToggle } from "@ailuracode/alpine-toggle";
import { createDoggoToggle } from "@ailuracode/alpine-toggle/doggo";
import { createPuppyToggle } from "@ailuracode/alpine-toggle/puppy";
import type { AlpineInstance } from "../types/alpine.js";

type YesNo = "yes" | "no";
type YesNoUnknown = YesNo | "unknown";
type EnabledDisabledMixed = "enabled" | "disabled" | "mixed";

type ToggleStatesView<TA, TB, TN> = ToggleInstance<TA, TB, TN, TA | TB | TN>["states"];

type TogglePuppyDemoData = {
  value: boolean;
  init(): void;
  toggle(): boolean;
  setTrue(): void;
  setFalse(): void;
};

type ToggleDoggoDemoData = {
  value: EnabledDisabledMixed;
  states: ToggleStatesView<EnabledDisabledMixed, EnabledDisabledMixed, EnabledDisabledMixed>;
  lastChange: string;
  init(): void;
  is(candidate: EnabledDisabledMixed): boolean;
  toggle(): EnabledDisabledMixed;
  next(): EnabledDisabledMixed;
  reset(): EnabledDisabledMixed;
};

type ToggleBinaryDemoData = {
  value: YesNo;
  states: ToggleStatesView<"yes", "no", undefined>;
  init(): void;
  is(candidate: YesNo): boolean;
  toggle(): YesNo;
  next(): YesNo;
  reset(): YesNo;
};

type ToggleTernaryDemoData = {
  value: YesNoUnknown;
  states: ToggleStatesView<"yes", "no", "unknown">;
  init(): void;
  is(candidate: YesNoUnknown): boolean;
  toggle(): YesNoUnknown;
  next(): YesNoUnknown;
  reset(): YesNoUnknown;
  setUnknown(): void;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "togglePuppyDemo",
    (): TogglePuppyDemoData => ({
      value: false,
      init(this: TogglePuppyDemoData & { controller: ReturnType<typeof createPuppyToggle> }) {
        this.controller = createPuppyToggle(false);
        this.value = this.controller.value;
      },
      toggle(this: TogglePuppyDemoData & { controller: ReturnType<typeof createPuppyToggle> }) {
        this.value = this.controller.toggle();
        return this.value;
      },
      setTrue(this: TogglePuppyDemoData & { controller: ReturnType<typeof createPuppyToggle> }) {
        this.controller.set(true);
        this.value = this.controller.value;
      },
      setFalse(this: TogglePuppyDemoData & { controller: ReturnType<typeof createPuppyToggle> }) {
        this.controller.set(false);
        this.value = this.controller.value;
      },
    })
  );

  Alpine.data(
    "toggleDoggoDemo",
    (): ToggleDoggoDemoData => ({
      value: "mixed",
      states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
      lastChange: "",
      init(
        this: ToggleDoggoDemoData & {
          controller: ReturnType<
            typeof createDoggoToggle<
              EnabledDisabledMixed,
              EnabledDisabledMixed,
              EnabledDisabledMixed
            >
          >;
        }
      ) {
        this.controller = createDoggoToggle({
          states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
          initial: "mixed",
        });
        this.states = this.controller.states;
        this.value = this.controller.value;
        this.controller.onChange(({ current, previous }) => {
          this.value = current;
          this.lastChange = `${String(previous)} → ${String(current)}`;
        });
      },
      is(this: ToggleDoggoDemoData, candidate: EnabledDisabledMixed) {
        return this.value === candidate;
      },
      toggle(
        this: ToggleDoggoDemoData & {
          controller: ReturnType<
            typeof createDoggoToggle<
              EnabledDisabledMixed,
              EnabledDisabledMixed,
              EnabledDisabledMixed
            >
          >;
        }
      ) {
        this.value = this.controller.toggle();
        return this.value;
      },
      next(
        this: ToggleDoggoDemoData & {
          controller: ReturnType<
            typeof createDoggoToggle<
              EnabledDisabledMixed,
              EnabledDisabledMixed,
              EnabledDisabledMixed
            >
          >;
        }
      ) {
        this.value = this.controller.next();
        return this.value;
      },
      reset(
        this: ToggleDoggoDemoData & {
          controller: ReturnType<
            typeof createDoggoToggle<
              EnabledDisabledMixed,
              EnabledDisabledMixed,
              EnabledDisabledMixed
            >
          >;
        }
      ) {
        this.value = this.controller.reset();
        return this.value;
      },
    })
  );

  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleBinaryDemoData => ({
      value: "no",
      states: { on: "yes", off: "no", indeterminate: undefined },
      init(
        this: ToggleBinaryDemoData & { controller: ToggleInstance<"yes", "no", undefined, YesNo> }
      ) {
        this.controller = createToggle({
          states: { on: "yes", off: "no" },
          initial: "no",
        });
        this.states = this.controller.states;
        this.value = this.controller.value;
      },
      is(this: ToggleBinaryDemoData, candidate: YesNo) {
        return this.value === candidate;
      },
      toggle(
        this: ToggleBinaryDemoData & { controller: ToggleInstance<"yes", "no", undefined, YesNo> }
      ) {
        this.value = this.controller.toggle();
        return this.value;
      },
      next(
        this: ToggleBinaryDemoData & { controller: ToggleInstance<"yes", "no", undefined, YesNo> }
      ) {
        this.value = this.controller.next();
        return this.value;
      },
      reset(
        this: ToggleBinaryDemoData & { controller: ToggleInstance<"yes", "no", undefined, YesNo> }
      ) {
        this.value = this.controller.reset();
        return this.value;
      },
    })
  );

  Alpine.data(
    "toggleTernaryDemo",
    (): ToggleTernaryDemoData => ({
      value: "unknown",
      states: { on: "yes", off: "no", indeterminate: "unknown" },
      init(
        this: ToggleTernaryDemoData & {
          controller: ToggleInstance<"yes", "no", "unknown", YesNoUnknown>;
        }
      ) {
        this.controller = createToggle({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        });
        this.states = this.controller.states;
        this.value = this.controller.value;
      },
      is(this: ToggleTernaryDemoData, candidate: YesNoUnknown) {
        return this.value === candidate;
      },
      toggle(
        this: ToggleTernaryDemoData & {
          controller: ToggleInstance<"yes", "no", "unknown", YesNoUnknown>;
        }
      ) {
        this.value = this.controller.toggle();
        return this.value;
      },
      next(
        this: ToggleTernaryDemoData & {
          controller: ToggleInstance<"yes", "no", "unknown", YesNoUnknown>;
        }
      ) {
        this.value = this.controller.next();
        return this.value;
      },
      reset(
        this: ToggleTernaryDemoData & {
          controller: ToggleInstance<"yes", "no", "unknown", YesNoUnknown>;
        }
      ) {
        this.value = this.controller.reset();
        return this.value;
      },
      setUnknown(
        this: ToggleTernaryDemoData & {
          controller: ToggleInstance<"yes", "no", "unknown", YesNoUnknown>;
        }
      ) {
        this.controller.set(this.states.indeterminate);
        this.value = this.controller.value;
      },
    })
  );
}
