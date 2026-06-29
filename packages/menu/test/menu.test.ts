import { beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import menuPlugin, { createMenuStore } from "../src/index.js";

describe("@ailuracode/alpine-menu", () => {
  let store: ReturnType<typeof createMenuStore>;

  beforeEach(() => {
    store = createMenuStore();
    store.register("user-menu");
    store.registerItem("user-menu", "profile");
    store.registerItem("user-menu", "settings");
    store.registerItem("user-menu", "logout");
  });

  it("opens, toggles, and closes menus", () => {
    expect(store.isOpen("user-menu")).toBe(false);

    store.open("user-menu");
    expect(store.isOpen("user-menu")).toBe(true);
    expect(store.activeItem("user-menu")).toBe("profile");

    store.toggle("user-menu");
    expect(store.isOpen("user-menu")).toBe(false);
  });

  it("moves active item with arrow keys", () => {
    store.open("user-menu");

    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(store.activeItem("user-menu")).toBe("settings");

    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "End" }));
    expect(store.activeItem("user-menu")).toBe("logout");
  });

  it("focuses the active item when the menu container is bound", async () => {
    const container = document.createElement("ul");
    const profile = document.createElement("button");
    profile.setAttribute("role", "menuitem");
    profile.tabIndex = 0;
    container.append(profile);
    document.body.append(container);

    store.bindMenu("user-menu", container);
    store.open("user-menu");

    await Promise.resolve();

    expect(document.activeElement).toBe(profile);
    container.remove();
  });

  it("calls onSelect when an item is chosen with Enter", () => {
    const onSelect = vi.fn();
    store.register("actions", { closeOnSelect: true, onSelect });
    store.registerItem("actions", "save");
    store.open("actions");

    store.handleKeydown("actions", new KeyboardEvent("keydown", { key: "Enter" }));

    expect(onSelect).toHaveBeenCalledWith("save");
    expect(store.isOpen("actions")).toBe(false);
  });

  it("closes on Escape and selects on Enter", () => {
    const onClose = vi.fn();
    store.register("actions", { closeOnSelect: true, onClose });
    store.registerItem("actions", "save");
    store.open("actions");

    store.handleKeydown("actions", new KeyboardEvent("keydown", { key: "Enter" }));
    expect(store.isOpen("actions")).toBe(false);

    store.open("user-menu");
    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "Escape" }));
    expect(store.isOpen("user-menu")).toBe(false);
  });

  it("exposes roving tabindex item props", () => {
    store.open("user-menu");
    store.setActiveItem("user-menu", "settings");

    expect(store.itemProps("user-menu", "settings")).toMatchObject({
      role: "menuitem",
      tabindex: 0,
      "aria-disabled": false,
    });

    expect(store.itemProps("user-menu", "profile").tabindex).toBe(-1);
  });

  it("closes when clicking outside the trigger and menu", () => {
    const trigger = document.createElement("button");
    const container = document.createElement("ul");
    const outside = document.createElement("div");
    document.body.append(outside, trigger, container);

    store.bindTrigger("user-menu", trigger);
    store.bindMenu("user-menu", container);
    store.open("user-menu");

    store.handleOutsideClick("user-menu", { target: outside } as unknown as MouseEvent);
    expect(store.isOpen("user-menu")).toBe(false);

    outside.remove();
    trigger.remove();
    container.remove();
  });

  it("registers with Alpine store", () => {
    const Alpine = startAlpine(menuPlugin());
    const menu = Alpine.store("menu") as ReturnType<typeof createMenuStore>;

    menu.register("demo");
    menu.open("demo");
    expect(menu.isOpen("demo")).toBe(true);
  });

  it("notifies onLockChange while menus are open", () => {
    const onLockChange = vi.fn();
    store = createMenuStore({ onLockChange });
    store.register("user-menu");
    store.open("user-menu");

    expect(onLockChange).toHaveBeenLastCalledWith(true);

    store.close("user-menu");
    expect(onLockChange).toHaveBeenLastCalledWith(false);
  });

  it("cleans up scroll lock on destroy", () => {
    const onLockChange = vi.fn();
    store = createMenuStore({ onLockChange });
    store.register("user-menu");
    store.open("user-menu");
    store.destroy();

    expect(store.isOpen("user-menu")).toBe(false);
    expect(onLockChange).toHaveBeenLastCalledWith(false);
  });
});
