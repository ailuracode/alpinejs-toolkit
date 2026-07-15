import type { ScrollStore } from "@ailuracode/alpine-scroll";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import dialogPlugin, { createDialogStore, createFocusTrap } from "../src/index.js";

function createScrollStoreMock(): ScrollStore {
  return {
    active: false,
    count: 0,
    styles: {},
    locks: [],
    lock: vi.fn(() => "dialog-lock"),
    unlock: vi.fn(),
    clear: vi.fn(),
  } as unknown as ScrollStore;
}

describe("@ailuracode/alpine-dialog", () => {
  let store: ReturnType<typeof createDialogStore>;

  beforeEach(() => {
    store = createDialogStore();
  });

  it("starts closed for unknown dialogs", () => {
    expect(store.isOpen("settings")).toBe(false);
  });

  it("opens, toggles, and closes by id", () => {
    store.open("settings");
    expect(store.isOpen("settings")).toBe(true);

    store.toggle("settings");
    expect(store.isOpen("settings")).toBe(false);

    store.toggle("settings");
    expect(store.isOpen("settings")).toBe(true);

    store.close("settings");
    expect(store.isOpen("settings")).toBe(false);
  });

  it("tracks multiple dialog instances independently", () => {
    store.open("a");
    store.open("b");

    expect(store.isOpen("a")).toBe(true);
    expect(store.isOpen("b")).toBe(true);

    store.close("a");
    expect(store.isOpen("a")).toBe(false);
    expect(store.isOpen("b")).toBe(true);
  });

  it("calls onOpen and onClose callbacks", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();

    store.register("settings", { onOpen, onClose });
    store.open("settings");
    expect(onOpen).toHaveBeenCalledOnce();

    store.close("settings");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on Escape when enabled", () => {
    store.register("settings", { closeOnEscape: true });
    store.open("settings");

    store.handleKeydown("settings", new KeyboardEvent("keydown", { key: "Escape" }));
    expect(store.isOpen("settings")).toBe(false);
  });

  it("exposes dialog ARIA props", () => {
    store.register("settings", { labelledBy: "settings-title", describedBy: "settings-desc" });
    store.open("settings");

    expect(store.dialogProps("settings")).toMatchObject({
      role: "dialog",
      "aria-modal": true,
      "aria-labelledby": "settings-title",
      "aria-describedby": "settings-desc",
    });
  });

  it("traps focus inside a container", () => {
    const container = document.createElement("div");
    const first = document.createElement("button");
    const last = document.createElement("button");
    container.append(first, last);
    document.body.append(container);

    const trap = createFocusTrap(container);
    trap.activate();
    expect(document.activeElement).toBe(first);

    last.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    container.dispatchEvent(event);
    expect(document.activeElement).toBe(first);

    trap.deactivate();
    container.remove();
  });

  it("registers with Alpine store", () => {
    const Alpine = startAlpine(dialogPlugin());
    const dialog = Alpine.store("dialog") as ReturnType<typeof createDialogStore>;

    dialog.open("demo");
    expect(dialog.isOpen("demo")).toBe(true);
  });

  it("cleans up on destroy", () => {
    const scroll = createScrollStoreMock();
    store = createDialogStore({ scroll, defaultScrollLock: true });
    store.register("settings", { scrollLock: true });
    store.open("settings");
    store.destroy();

    expect(store.isOpen("settings")).toBe(false);
    expect(scroll.lock).toHaveBeenCalledWith("dialog");
    expect(scroll.unlock).toHaveBeenLastCalledWith("dialog-lock");
  });

  it("handles open on already open dialog", () => {
    store.open("settings");
    store.open("settings");
    expect(store.isOpen("settings")).toBe(true);
  });

  it("handles close on closed dialog", () => {
    store.close("settings");
    expect(store.isOpen("settings")).toBe(false);
  });

  it("handles closeOnEscape: false", () => {
    store.register("settings", { closeOnEscape: false });
    store.open("settings");
    store.handleKeydown("settings", new KeyboardEvent("keydown", { key: "Escape" }));
    expect(store.isOpen("settings")).toBe(true);
  });

  it("handles dialogProps on unknown dialog", () => {
    const props = store.dialogProps("nonexistent");
    expect(props.role).toBe("dialog");
  });

  it("handles scrollLock: false", () => {
    const scroll = createScrollStoreMock();
    store = createDialogStore({ scroll, defaultScrollLock: true });
    store.register("settings", { scrollLock: false });
    store.open("settings");
    expect(scroll.lock).not.toHaveBeenCalled();
  });

  it("handles defaultScrollLock: false", () => {
    const scroll = createScrollStoreMock();
    store = createDialogStore({ scroll, defaultScrollLock: false });
    store.open("settings");
    expect(scroll.lock).not.toHaveBeenCalled();
  });

  it("focus trap handles shift+tab on first element", () => {
    const container = document.createElement("div");
    const first = document.createElement("button");
    const last = document.createElement("button");
    container.append(first, last);
    document.body.append(container);

    const trap = createFocusTrap(container);
    trap.activate();
    first.focus();

    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, shiftKey: true });
    container.dispatchEvent(event);
    expect(document.activeElement).toBe(last);

    trap.deactivate();
    container.remove();
  });

  it("unregister removes dialog instance", () => {
    store.register("settings");
    expect(store.instances.settings).toBeDefined();
    store.unregister("settings");
    expect(store.instances.settings).toBeUndefined();
    store.register("settings");
    store.open("settings");
    expect(store.isOpen("settings")).toBe(true);
  });
});
