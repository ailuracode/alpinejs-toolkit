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
    expect(store.filteredItems.map((item) => item.id)).toEqual(["toggle-theme"]);
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
    store.activeIndex = store.filteredItems.findIndex((item) => item.id === "save");

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
    expect(store.filteredItems.map((item) => item.id)).toEqual(["toggle-theme"]);

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
});
