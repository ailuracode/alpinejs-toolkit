/**
 * Tests for {@link ThemeController} id generation. Verifies the
 * `theme-*` prefix is applied when the consumer omits `options.id`
 * and the explicit value is preserved otherwise.
 */
import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { ThemeController } from "../src/controller";

describe("ThemeController id", () => {
  it("uses a `theme-*` default id when no id is provided", () => {
    const controller = new ThemeController({});
    assert.match(controller.id, /^theme-[a-z0-9]+$/);
  });

  it("preserves an explicit id", () => {
    const controller = new ThemeController({ id: "my-theme" });
    assert.equal(controller.id, "my-theme");
    assert.equal(controller.current, "system");
  });

  it("produces a unique default id per controller", () => {
    const a = new ThemeController({});
    const b = new ThemeController({});
    assert.notEqual(a.id, b.id);
  });
});
