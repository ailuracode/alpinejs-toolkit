import { describe, expect, it } from "vitest";
import { appendStyle, applyCssText, applyStyle, bindHover } from "../src/devtools/style-utils.js";

function createElement(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

describe("style-utils — coverage", () => {
  describe("applyStyle", () => {
    it("applies string values", () => {
      const el = createElement();
      applyStyle(el, { backgroundColor: "red" });
      expect(el.style.backgroundColor).toBe("red");
    });

    it("applies number values", () => {
      const el = createElement();
      applyStyle(el, { zIndex: 5 });
      expect(el.style.zIndex).toBe("5");
    });

    it("skips undefined values", () => {
      const el = createElement();
      applyStyle(el, { backgroundColor: undefined, color: "blue" });
      expect(el.style.color).toBe("blue");
      expect(el.style.backgroundColor).toBe("");
    });

    it("skips null values", () => {
      const el = createElement();
      applyStyle(el, { backgroundColor: null });
      expect(el.style.backgroundColor).toBe("");
    });

    it("skips empty string values", () => {
      const el = createElement();
      applyStyle(el, { backgroundColor: "" });
      expect(el.style.backgroundColor).toBe("");
    });

    it("converts camelCase to kebab-case", () => {
      const el = createElement();
      applyStyle(el, { paddingTop: "10px" });
      expect(el.style.paddingTop).toBe("10px");
    });
  });

  describe("appendStyle", () => {
    it("appends to existing cssText", () => {
      const el = createElement();
      el.style.cssText = "color: red";
      appendStyle(el, { backgroundColor: "blue" });
      expect(el.style.cssText).toContain("color: red");
      expect(el.style.cssText).toContain("background-color: blue");
    });

    it("skips undefined, null, and empty values", () => {
      const el = createElement();
      appendStyle(el, { backgroundColor: undefined, color: null, padding: "" });
      expect(el.style.cssText).toBe("");
    });

    it("does nothing when all values are skipped", () => {
      const el = createElement();
      applyCssText(el, "color: red");
      appendStyle(el, { backgroundColor: undefined, color: null });
      expect(el.style.color).toBe("red");
      expect(el.style.backgroundColor).toBe("");
    });
  });

  describe("applyCssText", () => {
    it("sets cssText directly", () => {
      const el = createElement();
      applyCssText(el, "color: red; padding: 10px");
      expect(el.style.color).toBe("red");
      expect(el.style.padding).toBe("10px");
    });
  });

  describe("bindHover", () => {
    it("applies base style on mount and switches on hover", () => {
      const el = createElement();
      bindHover(el, { backgroundColor: "blue" }, { backgroundColor: "green" });
      expect(el.style.backgroundColor).toBe("blue");

      el.dispatchEvent(new Event("mouseenter"));
      expect(el.style.backgroundColor).toBe("green");

      el.dispatchEvent(new Event("mouseleave"));
      expect(el.style.backgroundColor).toBe("blue");
    });
  });
});
