import type { ToggleInstance } from "@ailuracode/alpine-toggle";
import type { AlpineInstance } from "../types/alpine.js";

type BinaryPower = ToggleInstance<"on", "off", undefined, "on" | "off">;
type TernaryAnswer = ToggleInstance<"yes", "no", "unknown", "yes" | "no" | "unknown">;

type ToggleBinaryDemoData = {
  power: BinaryPower | null;
  init(): void;
};

type ToggleTernaryDemoData = {
  answer: TernaryAnswer | null;
  init(): void;
};

type ToggleFactory = {
  <TA, TB>(options: {
    states: { on: TA; off: TB };
    initial?: TA | TB;
  }): ToggleInstance<TA, TB, undefined, TA | TB>;
  <TA, TB, TN>(options: {
    states: { on: TA; off: TB; indeterminate: TN };
    initial?: TA | TB | TN;
  }): ToggleInstance<TA, TB, TN, TA | TB | TN>;
};

type ToggleBinaryDemoComponent = ToggleBinaryDemoData & {
  $toggle: ToggleFactory;
};

type ToggleTernaryDemoComponent = ToggleTernaryDemoData & {
  $toggle: ToggleFactory;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleBinaryDemoData => ({
      power: null,
      init(this: ToggleBinaryDemoComponent) {
        this.power = this.$toggle({
          states: { on: "on", off: "off" },
          initial: "off",
        });
      },
    })
  );

  Alpine.data(
    "toggleTernaryDemo",
    (): ToggleTernaryDemoData => ({
      answer: null,
      init(this: ToggleTernaryDemoComponent) {
        this.answer = this.$toggle({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        });
      },
    })
  );
}
