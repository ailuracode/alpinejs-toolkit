import { afterEach, describe, expect, it, vi } from "vitest";
import { createKeyboard } from "../src/controller.js";

function dispatchKey(
  keyName: string,
  init: KeyboardEventInit = {},
  target: EventTarget = document.body
): void {
  const event = new KeyboardEvent("keydown", { key: keyName, bubbles: true, ...init });
  Object.defineProperty(event, "target", { value: target });
  window.dispatchEvent(event);
}

describe("@ailuracode/alpine-keyboard integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("simulates the demo flow through the global window listener", () => {
    const log: string[] = [];
    const keyboard = createKeyboard({ pauseWhileScopesActive: ["modal"] });

    keyboard.register("mod+shift+k", () => log.push("chord"), {
      id: "demo-chord",
      metadata: { label: "Demo chord" },
    });
    keyboard.register("g h", () => log.push("sequence"), { id: "demo-sequence" });
    keyboard.register("x", () => log.push("editor"), { id: "demo-editor", scope: "editor" });
    keyboard.register("m", () => log.push("global-blocked"), {
      id: "global-m",
      scope: "global",
    });

    // Chord: mod+shift+k (non-mac → ctrl)
    dispatchKey("k", { ctrlKey: true, shiftKey: true });
    expect(log).toEqual(["chord"]);

    // Sequence: g then h
    log.length = 0;
    dispatchKey("g");
    dispatchKey("h");
    expect(log).toEqual(["sequence"]);

    // Editor scope inactive → x ignored
    log.length = 0;
    dispatchKey("x");
    expect(log).toEqual([]);

    keyboard.activateScope("editor");
    dispatchKey("x");
    expect(log).toEqual(["editor"]);

    // Global shortcut paused while modal scope active
    log.length = 0;
    keyboard.activateScope("modal");
    dispatchKey("m");
    expect(log).toEqual([]);

    keyboard.deactivateScope("modal");
    dispatchKey("m");
    expect(log).toEqual(["global-blocked"]);

    keyboard.destroy();
  });

  it("applies preventDefault and stopPropagation policies", () => {
    const keyboard = createKeyboard();
    const handler = vi.fn((event: KeyboardEvent) => {
      expect(event.defaultPrevented).toBe(true);
    });

    keyboard.register("p", handler, {
      id: "prevent",
      preventDefault: true,
      stopPropagation: true,
    });

    const event = new KeyboardEvent("keydown", { key: "p", bubbles: true, cancelable: true });
    Object.defineProperty(event, "target", { value: document.body });
    const stopSpy = vi.spyOn(event, "stopPropagation");

    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledOnce();
    expect(stopSpy).toHaveBeenCalledOnce();

    keyboard.destroy();
  });
});
