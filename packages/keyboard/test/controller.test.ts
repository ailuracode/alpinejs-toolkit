import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createKeyboard, KeyboardController } from "../src/controller.js";
import { isEditableTarget } from "../src/editable.js";
import { KeyboardError } from "../src/errors.js";

function key(
  keyName: string,
  init: KeyboardEventInit = {},
  target: EventTarget | null = document.body
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", { key: keyName, bubbles: true, ...init });
  Object.defineProperty(event, "target", { value: target });
  return event;
}

describe("@ailuracode/alpine-keyboard", () => {
  describe("KeyboardController", () => {
    let controller: KeyboardController;

    beforeEach(() => {
      controller = new KeyboardController({}, false);
      controller.mount();
    });

    afterEach(() => {
      controller.destroy();
    });

    it("imports without browser globals", async () => {
      await expect(import("../src/index.js")).resolves.toBeDefined();
    });

    it("registers shortcuts and returns a disposer", () => {
      const handler = vi.fn();
      const dispose = controller.register("mod+k", handler, { id: "save" });
      expect(controller.commands).toHaveLength(1);
      dispose();
      expect(controller.commands).toHaveLength(0);
    });

    it("fires single-chord shortcuts on handleKeydown", () => {
      const handler = vi.fn();
      controller.register("ctrl+s", handler, { id: "save" });
      controller.handleKeydown(key("s", { ctrlKey: true }));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("resolves conflicts by priority", () => {
      const low = vi.fn();
      const high = vi.fn();
      controller.register("ctrl+k", low, { id: "low", priority: 0 });
      controller.register("ctrl+k", high, { id: "high", priority: 10 });

      controller.handleKeydown(key("k", { ctrlKey: true }));

      expect(high).toHaveBeenCalledOnce();
      expect(low).not.toHaveBeenCalled();
    });

    it("completes multi-key sequences within timeout", () => {
      vi.useFakeTimers();
      const handler = vi.fn();
      controller.register("g h", handler, { id: "go-home" });

      controller.handleKeydown(key("g"));
      controller.handleKeydown(key("h"));

      expect(handler).toHaveBeenCalledOnce();
      vi.useRealTimers();
    });

    it("cancels sequences after timeout", () => {
      vi.useFakeTimers();
      const seqController = new KeyboardController({ sequenceTimeout: 500 }, false);
      seqController.mount();
      const handler = vi.fn();
      seqController.register("g h", handler, { id: "go-home" });

      seqController.handleKeydown(key("g"));
      vi.advanceTimersByTime(600);
      seqController.handleKeydown(key("h"));

      expect(handler).not.toHaveBeenCalled();
      seqController.destroy();
      vi.useRealTimers();
    });

    it("ignores shortcuts in editable targets by default", () => {
      const handler = vi.fn();
      controller.register("a", handler, { id: "letter-a" });
      const input = document.createElement("input");
      document.body.append(input);

      controller.handleKeydown(key("a", {}, input));

      expect(handler).not.toHaveBeenCalled();
      input.remove();
    });

    it("allows editable shortcuts when configured", () => {
      const handler = vi.fn();
      controller.register("a", handler, { id: "letter-a", allowInEditable: true });
      const input = document.createElement("input");
      document.body.append(input);

      controller.handleKeydown(key("a", {}, input));

      expect(handler).toHaveBeenCalledOnce();
      input.remove();
    });

    it("respects active scopes", () => {
      const globalHandler = vi.fn();
      const dialogHandler = vi.fn();
      controller.register("d", globalHandler, { id: "global-d", scope: "global" });
      controller.register("x", dialogHandler, { id: "dialog-x", scope: "dialog" });

      controller.handleKeydown(key("x"));
      expect(dialogHandler).not.toHaveBeenCalled();

      controller.activateScope("dialog");
      controller.handleKeydown(key("x"));
      expect(dialogHandler).toHaveBeenCalledOnce();
    });

    it("suspends scopes without deactivating them", () => {
      const handler = vi.fn();
      controller.register("x", handler, { id: "x", scope: "editor" });
      controller.activateScope("editor");
      controller.suspendScope("editor");

      controller.handleKeydown(key("x"));
      expect(handler).not.toHaveBeenCalled();

      controller.resumeScope("editor");
      controller.handleKeydown(key("x"));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("pauses global shortcuts while configured scopes are active", () => {
      const controllerWithPause = new KeyboardController({
        pauseWhileScopesActive: ["modal"],
      });
      controllerWithPause.mount();

      const handler = vi.fn();
      controllerWithPause.register("m", handler, { id: "global-m", scope: "global" });

      controllerWithPause.activateScope("modal");
      controllerWithPause.handleKeydown(key("m"));
      expect(handler).not.toHaveBeenCalled();

      controllerWithPause.deactivateScope("modal");
      controllerWithPause.handleKeydown(key("m"));
      expect(handler).toHaveBeenCalledOnce();

      controllerWithPause.destroy();
    });

    it("mount is idempotent and does not duplicate listeners", () => {
      const addSpy = vi.spyOn(window, "addEventListener");
      const first = new KeyboardController({}, false);
      first.mount();
      const initialCalls = addSpy.mock.calls.filter(([type]) => type === "keydown").length;
      first.mount();
      const afterSecond = addSpy.mock.calls.filter(([type]) => type === "keydown").length;
      expect(afterSecond).toBe(initialCalls);
      first.destroy();
      addSpy.mockRestore();
    });

    it("removes listeners on destroy", () => {
      const removeSpy = vi.spyOn(window, "removeEventListener");
      const instance = createKeyboard();
      instance.destroy();
      expect(removeSpy.mock.calls.some(([type]) => type === "keydown")).toBe(true);
      removeSpy.mockRestore();
    });

    it("throws when registering after destroy", () => {
      controller.destroy();
      expect(() => controller.register("a", vi.fn())).toThrow(KeyboardError);
    });

    it("supports conditional shortcuts via when()", () => {
      const handler = vi.fn();
      let enabled = false;
      controller.register("w", handler, {
        id: "conditional",
        when: () => enabled,
      });

      controller.handleKeydown(key("w"));
      expect(handler).not.toHaveBeenCalled();

      enabled = true;
      controller.handleKeydown(key("w"));
      expect(handler).toHaveBeenCalledOnce();
    });

    it("detects editable targets", () => {
      const textarea = document.createElement("textarea");
      document.body.append(textarea);
      const event = key("a", {}, textarea);
      expect(isEditableTarget(event, 'textarea, input, [contenteditable="true"]')).toBe(true);
      textarea.remove();
    });
  });

  describe("multiple controllers", () => {
    it("keeps independent registrations", () => {
      const first = createKeyboard();
      const second = createKeyboard();
      const firstHandler = vi.fn();
      const secondHandler = vi.fn();

      first.register("a", firstHandler, { id: "a" });
      second.register("b", secondHandler, { id: "b" });

      first.handleKeydown(key("a"));
      second.handleKeydown(key("b"));

      expect(firstHandler).toHaveBeenCalledOnce();
      expect(secondHandler).toHaveBeenCalledOnce();

      first.destroy();
      second.destroy();
    });
  });
});
