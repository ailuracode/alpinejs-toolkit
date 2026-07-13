import { beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import commandPlugin, { createCommandStore } from "../src/index.js";

describe("@ailuracode/alpine-command integration", () => {
  let store: ReturnType<typeof createCommandStore>;

  beforeEach(() => {
    store = createCommandStore();
    store.register({
      id: "toggle-theme",
      label: "Toggle theme",
      group: "Appearance",
      shortcut: "⌘K",
      action: vi.fn(),
    });
    store.register({
      id: "open-settings",
      label: "Open settings",
      group: "General",
      action: vi.fn(),
    });
  });

  it("opens, toggles, and closes the palette", () => {
    expect(store.isOpen).toBe(false);

    store.open();
    expect(store.isOpen).toBe(true);

    store.toggle();
    expect(store.isOpen).toBe(false);
  });

  it("filters items by search text", () => {
    store.search = "theme";
    expect(store.filteredItems.map((item: unknown) => item.id)).toEqual(["toggle-theme"]);
  });

  it("groups filtered items", () => {
    store.search = "";
    expect(store.groupedItems.Appearance?.[0]?.id).toBe("toggle-theme");
    expect(store.groupedItems.General?.[0]?.id).toBe("open-settings");
  });

  it("runs actions on Enter and closes", async () => {
    const action = vi.fn();
    store.register({ id: "save", label: "Save", action });
    store.open();
    store.activeIndex = store.filteredItems.findIndex((item: unknown) => item.id === "save");

    store.handleKeydown(new KeyboardEvent("keydown", { key: "Enter" }));
    await vi.waitFor(() => {
      expect(store.isOpen).toBe(false);
    });
    expect(action).toHaveBeenCalledOnce();
  });

  it("navigates with arrow keys", () => {
    store.open();
    store.handleKeydown(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(store.activeIndex).toBe(1);
  });

  it("captures typing when search is not focused", () => {
    store.open();

    store.handleKeydown(new KeyboardEvent("keydown", { key: "t" }));
    store.handleKeydown(new KeyboardEvent("keydown", { key: "h" }));
    expect(store.search).toBe("th");
    expect(store.filteredItems.map((item: unknown) => item.id)).toEqual(["toggle-theme"]);

    store.handleKeydown(new KeyboardEvent("keydown", { key: "Backspace" }));
    expect(store.search).toBe("t");
  });

  it("does not duplicate typing when search input is focused", () => {
    store.open();
    const input = document.createElement("input");
    const event = new KeyboardEvent("keydown", { key: "t", bubbles: true });
    Object.defineProperty(event, "target", { value: input });

    store.handleKeydown(event);
    expect(store.search).toBe("");
  });

  it("registers with Alpine store", () => {
    const Alpine = startAlpine(commandPlugin());
    const command = Alpine.store("command") as ReturnType<typeof createCommandStore>;

    command.open();
    expect(command.isOpen).toBe(true);

    command.close();
    expect(command.isOpen).toBe(false);
  });

  it("handles ArrowUp navigation", () => {
    store.open();
    store.handleKeydown(new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(store.activeIndex).toBe(store.filteredItems.length - 1);
  });

  it("handles Escape to close", () => {
    store.open();
    store.handleKeydown(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(store.isOpen).toBe(false);
  });

  it("handles Home and End keys", () => {
    store.open();
    store.handleKeydown(new KeyboardEvent("keydown", { key: "End" }));
    expect(store.activeIndex).toBe(store.filteredItems.length - 1);

    store.handleKeydown(new KeyboardEvent("keydown", { key: "Home" }));
    expect(store.activeIndex).toBe(0);
  });

  it("clamps activeIndex when filtered items change", () => {
    store.open();
    store.activeIndex = 5;
    store.search = "theme";
    expect(store.activeIndex).toBe(0);
  });

  it("runs action on click", async () => {
    const action = vi.fn();
    store.register({ id: "click-test", label: "Click test", action });
    store.open();
    await store.run("click-test");
    expect(action).toHaveBeenCalled();
  });

  it("handles disabled items in run", async () => {
    const action = vi.fn();
    store.register({ id: "disabled-item", label: "Disabled", action, disabled: true });
    store.open();
    await store.run("disabled-item");
    expect(action).not.toHaveBeenCalled();
  });

  it("handles async actions in run", async () => {
    const action = vi.fn().mockResolvedValue(undefined);
    store.register({ id: "async-item", label: "Async", action });
    store.open();
    await store.run("async-item");
    expect(action).toHaveBeenCalled();
  });

  it("rejects duplicate registration", () => {
    expect(() => {
      store.register({ id: "toggle-theme", label: "Duplicate", action: vi.fn() });
    }).toThrow();
  });

  it("handles search with no results", () => {
    store.search = "nonexistent";
    expect(store.filteredItems).toHaveLength(0);
  });

  it("clears search on close", () => {
    store.open();
    store.search = "theme";
    store.close();
    expect(store.search).toBe("");
  });

  it("resets activeIndex on open", () => {
    store.open();
    store.activeIndex = 5;
    store.close();
    store.open();
    expect(store.activeIndex).toBe(0);
  });
});
