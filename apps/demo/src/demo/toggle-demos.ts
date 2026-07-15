import { createToggle, type ToggleInstance } from "@ailuracode/alpine-toggle";
import { createToggle as createDoggoToggle } from "@ailuracode/alpine-toggle/doggo";
import { createToggle as createPuppyToggle } from "@ailuracode/alpine-toggle/puppy";
import type { AlpineInstance } from "../types/alpine.js";

type YesNo = "yes" | "no";
type YesNoUnknown = YesNo | "unknown";
type EnabledDisabledMixed = "enabled" | "disabled" | "mixed";

type PuppyLamp = {
  value: boolean;
  toggle(): boolean;
  setTrue(): void;
  setFalse(): void;
};

type DoggoFilter = {
  value: EnabledDisabledMixed;
  states: ToggleInstance<
    EnabledDisabledMixed,
    EnabledDisabledMixed,
    EnabledDisabledMixed,
    EnabledDisabledMixed
  >["states"];
  is(candidate: EnabledDisabledMixed): boolean;
  toggle(): EnabledDisabledMixed;
  next(): EnabledDisabledMixed;
  reset(): EnabledDisabledMixed;
};

type BinaryPower = {
  value: YesNo;
  states: ToggleInstance<"yes", "no", undefined, YesNo>["states"];
  is(candidate: YesNo): boolean;
  set(value: YesNo): void;
  toggle(): YesNo;
  next(): YesNo;
  reset(): YesNo;
};

type TernaryAnswer = {
  value: YesNoUnknown;
  states: ToggleInstance<"yes", "no", "unknown", YesNoUnknown>["states"];
  is(candidate: YesNoUnknown): boolean;
  set(value: YesNoUnknown): void;
  toggle(): YesNoUnknown;
  next(): YesNoUnknown;
  reset(): YesNoUnknown;
};

type TogglePuppyDemoData = {
  lamp: PuppyLamp | null;
  init(): void;
};

type ToggleDoggoDemoData = {
  filter: DoggoFilter | null;
  lastChange: string;
  init(): void;
};

type ToggleBinaryDemoData = {
  power: BinaryPower | null;
  init(): void;
};

type ToggleTernaryDemoData = {
  answer: TernaryAnswer | null;
  init(): void;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "togglePuppyDemo",
    (): TogglePuppyDemoData => ({
      lamp: null,
      init(this: TogglePuppyDemoData) {
        const toggle = createPuppyToggle(false);
        this.lamp = {
          value: toggle.value,
          toggle: () => {
            const next = toggle.toggle();
            if (this.lamp) {
              this.lamp.value = next;
            }
            return next;
          },
          setTrue: () => {
            toggle.set(true);
            if (this.lamp) {
              this.lamp.value = toggle.value;
            }
          },
          setFalse: () => {
            toggle.set(false);
            if (this.lamp) {
              this.lamp.value = toggle.value;
            }
          },
        };
      },
    })
  );

  Alpine.data(
    "toggleDoggoDemo",
    (): ToggleDoggoDemoData => ({
      filter: null,
      lastChange: "",
      init(this: ToggleDoggoDemoData) {
        const toggle = createDoggoToggle({
          states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
          initial: "mixed",
        });
        const states = toggle.states;
        toggle.onChange(({ current, previous }) => {
          if (this.filter) {
            this.filter.value = current;
          }
          this.lastChange = `${String(previous)} → ${String(current)}`;
        });
        this.filter = {
          value: toggle.value,
          states,
          is(candidate) {
            return this.value === candidate;
          },
          toggle: () => {
            const next = toggle.toggle();
            if (this.filter) {
              this.filter.value = next;
            }
            return next;
          },
          next: () => {
            const next = toggle.next();
            if (this.filter) {
              this.filter.value = next;
            }
            return next;
          },
          reset: () => {
            const next = toggle.reset();
            if (this.filter) {
              this.filter.value = next;
            }
            return next;
          },
        };
      },
    })
  );

  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleBinaryDemoData => ({
      power: null,
      init(this: ToggleBinaryDemoData) {
        const toggle = createToggle({
          states: { on: "yes", off: "no" },
          initial: "no",
        });
        const states = toggle.states;
        this.power = {
          value: toggle.value,
          states,
          is(candidate) {
            return this.value === candidate;
          },
          set: (value) => {
            toggle.set(value);
            if (this.power) {
              this.power.value = toggle.value;
            }
          },
          toggle: () => {
            const next = toggle.toggle();
            if (this.power) {
              this.power.value = next;
            }
            return next;
          },
          next: () => {
            const next = toggle.next();
            if (this.power) {
              this.power.value = next;
            }
            return next;
          },
          reset: () => {
            const next = toggle.reset();
            if (this.power) {
              this.power.value = next;
            }
            return next;
          },
        };
      },
    })
  );

  Alpine.data(
    "toggleTernaryDemo",
    (): ToggleTernaryDemoData => ({
      answer: null,
      init(this: ToggleTernaryDemoData) {
        const toggle = createToggle({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        });
        const states = toggle.states;
        this.answer = {
          value: toggle.value,
          states,
          is(candidate) {
            return this.value === candidate;
          },
          set: (value) => {
            toggle.set(value);
            if (this.answer) {
              this.answer.value = toggle.value;
            }
          },
          toggle: () => {
            const next = toggle.toggle();
            if (this.answer) {
              this.answer.value = next;
            }
            return next;
          },
          next: () => {
            const next = toggle.next();
            if (this.answer) {
              this.answer.value = next;
            }
            return next;
          },
          reset: () => {
            const next = toggle.reset();
            if (this.answer) {
              this.answer.value = next;
            }
            return next;
          },
        };
      },
    })
  );
}
