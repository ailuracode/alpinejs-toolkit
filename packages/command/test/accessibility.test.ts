import { describe, expect, it, vi } from "vitest";
import { CommandController } from "../src/controller.js";

describe("@ailuracode/alpine-command accessibility", () => {
  it("marks disabled options with aria-disabled", () => {
    const controller = new CommandController();
    controller.register({
      id: "disabled",
      label: "Disabled",
      disabled: true,
      action: vi.fn(),
    });

    expect(controller.optionProps("disabled")).toMatchObject({
      role: "option",
      "aria-disabled": true,
    });
  });

  it("updates aria-activedescendant when the active row changes", () => {
    const controller = new CommandController();
    controller.register({ id: "a", label: "A", action: vi.fn() });
    controller.register({ id: "b", label: "B", action: vi.fn() });
    controller.open();
    controller.activeIndex = 1;

    expect(controller.inputProps()["aria-activedescendant"]).toBe("command-option-b");
  });
});
