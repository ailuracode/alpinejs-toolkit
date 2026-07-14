import { describe, expect, it } from "vitest";
import { SelectionController } from "../src/controller.js";

describe("@ailuracode/alpine-selection lifecycle", () => {
  it("destroy is idempotent", () => {
    const controller = new SelectionController();
    controller.create("list", { keys: ["a"] });
    controller.destroy();
    controller.destroy();
    expect(controller.isDestroyed).toBe(true);
  });

  it("rejects commands after destroy", () => {
    const controller = new SelectionController();
    controller.create("list", { keys: ["a"] });
    controller.destroy();
    expect(() => controller.replace("list", "a")).toThrow(/destroyed/i);
  });
});
