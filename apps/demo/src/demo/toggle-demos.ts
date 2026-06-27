import type { ToggleInstance, ToggleMagic } from "@ailuracode/alpine-toggle";
import type { Alpine } from "alpinejs";

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

type ToggleBinaryDemoComponent = ToggleBinaryDemoData & {
  $toggle: ToggleMagic;
};

type ToggleTernaryDemoComponent = ToggleTernaryDemoData & {
  $toggle: ToggleMagic;
};

export function registerToggleDemos(Alpine: Alpine): void {
  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleBinaryDemoData => ({
      power: null,
      init(this: ToggleBinaryDemoComponent) {
        this.power = this.$toggle({
          states: { truly: "on", falsely: "off" },
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
          states: { truly: "yes", falsely: "no", ternary: "unknown" },
          initial: "unknown",
        });
      },
    })
  );
}
