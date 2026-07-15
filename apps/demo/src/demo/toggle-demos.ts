import type { ToggleInstance } from "@ailuracode/alpine-toggle";
import { createToggle } from "@ailuracode/alpine-toggle";
import { createDoggoToggle } from "@ailuracode/alpine-toggle/doggo";
import { createPuppyToggle } from "@ailuracode/alpine-toggle/puppy";
import type { AlpineInstance } from "../types/alpine.js";

type YesNo = "yes" | "no";
type YesNoUnknown = YesNo | "unknown";
type EnabledDisabledMixed = "enabled" | "disabled" | "mixed";

type PuppyLamp = {
  value: boolean;
  set(value: boolean): void;
  toggle(): boolean;
};

type DoggoFilter = {
  value: EnabledDisabledMixed;
  states: ToggleInstance<
    EnabledDisabledMixed,
    EnabledDisabledMixed,
    EnabledDisabledMixed
  >["states"];
  is(candidate: EnabledDisabledMixed): boolean;
  set(value: EnabledDisabledMixed): void;
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
  lamp: PuppyLamp;
};

type ToggleDoggoDemoData = {
  filter: DoggoFilter | null;
  lastChange: string;
  init(): void;
};

type ToggleBinaryDemoData = {
  power: BinaryPower;
};

type ToggleTernaryDemoData = {
  answer: TernaryAnswer;
};

function wrapPuppy(controller: ReturnType<typeof createPuppyToggle>): PuppyLamp {
  const view: PuppyLamp = {
    value: controller.value,
    set(value) {
      controller.set(value);
      view.value = controller.value;
    },
    toggle() {
      const next = controller.toggle();
      view.value = next;
      return next;
    },
  };
  return view;
}

function wrapDoggo(
  controller: ReturnType<
    typeof createDoggoToggle<EnabledDisabledMixed, EnabledDisabledMixed, EnabledDisabledMixed>
  >,
  onChange: (detail: {
    current: EnabledDisabledMixed;
    previous: EnabledDisabledMixed | null;
  }) => void
): DoggoFilter {
  const states = controller.states;
  const view: DoggoFilter = {
    value: controller.value,
    states,
    is(candidate) {
      return view.value === candidate;
    },
    set(value) {
      controller.set(value);
      view.value = controller.value;
    },
    toggle() {
      const next = controller.toggle();
      view.value = next;
      return next;
    },
    next() {
      const next = controller.next();
      view.value = next;
      return next;
    },
    reset() {
      const next = controller.reset();
      view.value = next;
      return next;
    },
  };

  controller.onChange(onChange);
  return view;
}

function wrapBinaryToggle(toggle: ToggleInstance<"yes", "no", undefined, YesNo>): BinaryPower {
  const states = toggle.states;
  const view: BinaryPower = {
    value: toggle.value,
    states,
    is(candidate) {
      return view.value === candidate;
    },
    set(value) {
      toggle.set(value);
      view.value = toggle.value;
    },
    toggle() {
      const next = toggle.toggle();
      view.value = next;
      return next;
    },
    next() {
      const next = toggle.next();
      view.value = next;
      return next;
    },
    reset() {
      const next = toggle.reset();
      view.value = next;
      return next;
    },
  };
  return view;
}

function wrapTernaryToggle(
  toggle: ToggleInstance<"yes", "no", "unknown", YesNoUnknown>
): TernaryAnswer {
  const states = toggle.states;
  const view: TernaryAnswer = {
    value: toggle.value,
    states,
    is(candidate) {
      return view.value === candidate;
    },
    set(value) {
      toggle.set(value);
      view.value = toggle.value;
    },
    toggle() {
      const next = toggle.toggle();
      view.value = next;
      return next;
    },
    next() {
      const next = toggle.next();
      view.value = next;
      return next;
    },
    reset() {
      const next = toggle.reset();
      view.value = next;
      return next;
    },
  };
  return view;
}

export function registerToggleDemos(Alpine: AlpineInstance): void {
  Alpine.data(
    "togglePuppyDemo",
    (): TogglePuppyDemoData => ({
      lamp: wrapPuppy(createPuppyToggle(false)),
    })
  );

  Alpine.data(
    "toggleDoggoDemo",
    (): ToggleDoggoDemoData => ({
      filter: null,
      lastChange: "",
      init(this: ToggleDoggoDemoData) {
        this.filter = wrapDoggo(
          createDoggoToggle({
            states: { on: "enabled", off: "disabled", indeterminate: "mixed" },
            initial: "mixed",
          }),
          ({ current, previous }) => {
            this.lastChange = `${String(previous)} → ${String(current)}`;
          }
        );
      },
    })
  );

  Alpine.data(
    "toggleBinaryDemo",
    (): ToggleBinaryDemoData => ({
      power: wrapBinaryToggle(
        createToggle({
          states: { on: "yes", off: "no" },
          initial: "no",
        })
      ),
    })
  );

  Alpine.data(
    "toggleTernaryDemo",
    (): ToggleTernaryDemoData => ({
      answer: wrapTernaryToggle(
        createToggle({
          states: { on: "yes", off: "no", indeterminate: "unknown" },
          initial: "unknown",
        })
      ),
    })
  );
}
