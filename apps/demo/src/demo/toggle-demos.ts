import type * as BigDog from "@ailuracode/alpine-toggle";
import * as Doggo from "@ailuracode/alpine-toggle/doggo";
import * as Puppy from "@ailuracode/alpine-toggle/puppy";
import type { AlpineInstance } from "../types/alpine.js";

type PuppyToggleShell = {
  value: boolean;
  set(value: boolean): void;
  toggle(): boolean;
};

type DoggoToggleShell = {
  value: string;
  states: Doggo.ToggleInstance<string, string, string, string>["states"];
  is(candidate: string): boolean;
  set(value: string): void;
  toggle(): string;
  next(): string;
  reset(): string;
};

type ToggleBinaryDemoData = {
  toggle: BigDog.ToggleInstance<"yes", "no", undefined, "yes" | "no"> | null;
  init(): void;
};

type ToggleBinaryDemoComponent = ToggleBinaryDemoData & {
  $toggle(
    options: BigDog.ToggleOptions<"yes", "no", undefined>
  ): BigDog.ToggleInstance<"yes", "no", undefined, "yes" | "no">;
};

type ToggleTernaryDemoData = {
  toggle: BigDog.ToggleInstance<"yes", "no", "unknown", "yes" | "no" | "unknown"> | null;
  init(): void;
};

type ToggleTernaryDemoComponent = ToggleTernaryDemoData & {
  $toggle(
    options: BigDog.ToggleOptions<"yes", "no", "unknown">
  ): BigDog.ToggleInstance<"yes", "no", "unknown", "yes" | "no" | "unknown">;
};

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data("togglePuppyDemo", () => ({
    toggle: bindPuppyToggle(Alpine, Puppy.createToggle(false)),
  }));

  Alpine.data("toggleDoggoDemo", () => ({
    toggle: bindDoggoToggle(
      Alpine,
      Doggo.createToggle({
        states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
        initial: "mixed",
      })
    ),
  }));

  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleBinaryDemoData => ({
      toggle: null,
      init(this: ToggleBinaryDemoComponent) {
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
      init(this: ToggleTernaryDemoComponent) {
        this.toggle = this.$toggle({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        });
      },
    })
  );
}

/** Demo-only reactive shell — mirrors the Puppy plugin adapter for `createToggle`. */
function bindPuppyToggle(
  Alpine: AlpineInstance,
  controller: Pick<Puppy.ToggleInstance, "value" | "set" | "toggle">
): PuppyToggleShell {
  let view!: PuppyToggleShell;

  const draft = {
    value: controller.value,
    set(value: boolean) {
      controller.set(value);
      view.value = controller.value;
    },
    toggle() {
      const next = controller.toggle();
      view.value = controller.value;
      return next;
    },
  };

  view = Alpine.reactive(draft);
  return view;
}

/** Demo-only reactive shell — mirrors the Doggo plugin adapter for `createToggle`. */
function bindDoggoToggle(
  Alpine: AlpineInstance,
  controller: Doggo.ToggleInstance<string, string, string, string>
): DoggoToggleShell {
  let view!: DoggoToggleShell;

  const draft = {
    value: controller.value,
    states: controller.states,
    is(candidate: string) {
      return controller.is(candidate);
    },
    set(value: string) {
      controller.set(value);
      view.value = controller.value;
    },
    toggle() {
      const next = controller.toggle();
      view.value = controller.value;
      return next;
    },
    next() {
      const next = controller.next();
      view.value = controller.value;
      return next;
    },
    reset() {
      const next = controller.reset();
      view.value = controller.value;
      return next;
    },
  };

  view = Alpine.reactive(draft);

  controller.onChange((detail) => {
    view.value = detail.current;
  });

  return view;
}
