import type AlpineType from "alpinejs";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { createMagicHarness } from "../../../test/mock-alpine.js";
import togglePlugin, { createToggle, createToggleMagic, type ToggleMagic } from "../src/index.js";

describe("@ailuracode/alpinejs-toggle", () => {
  describe("createToggle() binary", () => {
    it("toggles between two opposite states", () => {
      const toggle = createToggle({
        states: { truly: "on", falsely: "off" },
        initial: "on",
      });

      expect(toggle.states).toEqual({ truly: "on", falsely: "off", ternary: undefined });
      expect(toggle.truly).toBe("on");
      expect(toggle.falsely).toBe("off");
      expect(toggle.ternary).toBeUndefined();
      expect(toggle.value).toBe("on");
      expect(toggle.is(toggle.truly)).toBe(true);
      expect(toggle.is(toggle.falsely)).toBe(false);

      toggle.toggle();
      expect(toggle.value).toBe("off");
      expect(toggle.is(toggle.falsely)).toBe(true);

      toggle.toggle();
      expect(toggle.value).toBe("on");
    });

    it("cycles through binary states", () => {
      const toggle = createToggle({ states: { truly: true, falsely: false } });

      toggle.cycle();
      expect(toggle.value).toBe(false);

      toggle.cycle();
      expect(toggle.value).toBe(true);
    });

    it("sets, checks and resets state", () => {
      const toggle = createToggle({
        states: { truly: 1, falsely: 0 },
        initial: 1,
      });

      expect(toggle.set(toggle.falsely)).toBe(true);
      expect(toggle.is(toggle.falsely)).toBe(true);
      expect(toggle.set(toggle.falsely)).toBe(false);

      expect(toggle.set(toggle.truly)).toBe(true);
      expect(toggle.set(toggle.truly)).toBe(false);

      toggle.reset();
      expect(toggle.value).toBe(1);
    });

    it("infers binary state value types", () => {
      const toggle = createToggle({ states: { truly: "on", falsely: "off" } });

      expectTypeOf(toggle.value).toEqualTypeOf<"on" | "off">();
      expectTypeOf(toggle.states.truly).toEqualTypeOf<"on">();
      expectTypeOf(toggle.states.falsely).toEqualTypeOf<"off">();
      expectTypeOf(toggle.ternary).toEqualTypeOf<undefined>();
    });
  });

  describe("createToggle() ternary", () => {
    it("toggles only between opposite states and skips independent state", () => {
      const toggle = createToggle({
        states: { truly: "yes", falsely: "no", ternary: "unknown" },
        initial: "unknown",
      });

      expect(toggle.truly).toBe("yes");
      expect(toggle.falsely).toBe("no");
      expect(toggle.ternary).toBe("unknown");
      expect(toggle.is(toggle.ternary)).toBe(true);

      toggle.toggle();
      expect(toggle.value).toBe("yes");
      expect(toggle.is(toggle.truly)).toBe(true);

      toggle.toggle();
      expect(toggle.value).toBe("no");
      expect(toggle.is(toggle.falsely)).toBe(true);

      toggle.toggle();
      expect(toggle.value).toBe("yes");
    });

    it("cycles through all three states", () => {
      const toggle = createToggle({
        states: { truly: "a", falsely: "b", ternary: "c" },
        initial: "a",
      });

      toggle.cycle();
      expect(toggle.value).toBe("b");

      toggle.cycle();
      expect(toggle.value).toBe("c");
      expect(toggle.is(toggle.ternary)).toBe(true);

      toggle.cycle();
      expect(toggle.value).toBe("a");
    });

    it("supports undefined as the ternary state value", () => {
      const toggle = createToggle({
        states: { truly: true, falsely: false, ternary: undefined },
        initial: undefined,
      });

      expect(toggle.ternary).toBeUndefined();
      expect(toggle.is(undefined)).toBe(true);

      toggle.toggle();
      expect(toggle.value).toBe(true);
    });

    it("infers ternary state value types", () => {
      const toggle = createToggle({
        states: { truly: true, falsely: false, ternary: null },
      });

      expectTypeOf(toggle.value).toEqualTypeOf<true | false | null>();
      expectTypeOf(toggle.states.truly).toEqualTypeOf<true>();
      expectTypeOf(toggle.states.falsely).toEqualTypeOf<false>();
      expectTypeOf(toggle.ternary).toEqualTypeOf<null>();
    });
  });

  describe("plugin", () => {
    it("registers callable $toggle magic", () => {
      const { toggle } = createMagicHarness(togglePlugin) as { toggle: ToggleMagic };
      const instance = toggle({ states: { truly: "open", falsely: "closed" } });

      expect(instance.ternary).toBeUndefined();
      instance.toggle();
      expect(instance.value).toBe("closed");
    });

    it("createToggleMagic() wraps instances with Alpine.reactive when Alpine is provided", () => {
      const reactive = vi.fn(<T>(value: T) => value);
      const magic = createToggleMagic({ reactive } as Pick<AlpineType.Alpine, "reactive">);

      magic({ states: { truly: "on", falsely: "off" } });

      expect(reactive).toHaveBeenCalledTimes(1);
    });
  });
});
