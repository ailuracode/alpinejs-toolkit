import { createToggle, type ToggleInstance } from "@ailuracode/alpine-toggle";
import type { AlpineInstance } from "../types/alpine.js";

type YesNo = "yes" | "no";
type YesNoUnknown = YesNo | "unknown";

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

type ToggleBinaryDemoData = {
  power: BinaryPower | null;
  init(): void;
};

type ToggleTernaryDemoData = {
  answer: TernaryAnswer | null;
  init(): void;
};

type ToggleBinaryDemoComponent = ToggleBinaryDemoData;
type ToggleTernaryDemoComponent = ToggleTernaryDemoData;

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleBinaryDemoData => ({
      power: null,
      init(this: ToggleBinaryDemoComponent) {
        const toggle = createToggle<"yes", "no">({
          states: {
            on: "yes",
            off: "no",
          },
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
      init(this: ToggleTernaryDemoComponent) {
        const toggle = createToggle<"yes", "no", "unknown">({
          states: {
            on: "yes",
            off: "no",
            indeterminate: "unknown",
          },
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
