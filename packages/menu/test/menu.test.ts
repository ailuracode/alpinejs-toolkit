import type { ScrollStore } from "@ailuracode/alpine-scroll";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import menuPlugin, { createMenuStore } from "../src/index.js";

function createScrollStoreMock(handle = "menu-lock"): ScrollStore {
  return {
    active: false,
    count: 0,
    styles: {},
    locks: [],
    lock: vi.fn(() => handle),
    unlock: vi.fn(),
    clear: vi.fn(),
  } as any as ScrollStore;
}

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

    store.handleOutsideClick("user-menu", { target: outside } as any as MouseEvent);
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

  it("locks scroll while menus are open", () => {
    const scroll = createScrollStoreMock();
    store = createMenuStore({ scroll });
    store.register("user-menu");
    store.open("user-menu");

    expect(scroll.lock).toHaveBeenCalledWith("menu");

    store.close("user-menu");
    expect(scroll.unlock).toHaveBeenLastCalledWith("menu-lock");
  });

  it("cleans up scroll lock on destroy", () => {
    const scroll = createScrollStoreMock();
    store = createMenuStore({ scroll });
    store.register("user-menu");
    store.open("user-menu");
    store.destroy();

    expect(store.isOpen("user-menu")).toBe(false);
    expect(scroll.unlock).toHaveBeenLastCalledWith("menu-lock");
  });

  it("closes other menus when opening one (exclusive default)", () => {
    store.register("actions");
    store.open("user-menu");
    store.open("actions");

    expect(store.isOpen("user-menu")).toBe(false);
    expect(store.isOpen("actions")).toBe(true);
  });

  it("closes other menus when toggling one open (exclusive default)", () => {
    store.register("actions");
    store.open("user-menu");
    store.toggle("actions");

    expect(store.isOpen("user-menu")).toBe(false);
    expect(store.isOpen("actions")).toBe(true);
  });

  it("allows multiple open menus when exclusive is false", () => {
    store = createMenuStore({ exclusive: false });
    store.register("user-menu");
    store.register("actions");
    store.open("user-menu");
    store.open("actions");

    expect(store.isOpen("user-menu")).toBe(true);
    expect(store.isOpen("actions")).toBe(true);
  });

  it("closes only menus in the same group when exclusive is false", () => {
    store = createMenuStore({ exclusive: false });
    store.register("file", { group: "menubar-1" });
    store.register("edit", { group: "menubar-1" });
    store.register("help", { group: "menubar-2" });
    store.register("account");

    store.open("file");
    store.open("help");
    store.open("account");
    expect(store.isOpen("file")).toBe(true);
    expect(store.isOpen("help")).toBe(true);
    expect(store.isOpen("account")).toBe(true);

    store.open("edit");
    expect(store.isOpen("file")).toBe(false);
    expect(store.isOpen("edit")).toBe(true);
    expect(store.isOpen("help")).toBe(true);
    expect(store.isOpen("account")).toBe(true);
  });

  it("routes window keydown to the open menu and closes on Escape", () => {
    store.open("user-menu");

    store.handleWindowKeydown(new KeyboardEvent("keydown", { key: "Escape" }), [
      "user-menu",
      "actions-menu",
    ]);

    expect(store.isOpen("user-menu")).toBe(false);
  });

  it("closes on window outside click for the requested menu ids", () => {
    const trigger = document.createElement("button");
    const container = document.createElement("ul");
    const outside = document.createElement("div");
    document.body.append(outside, trigger, container);

    store.bindTrigger("user-menu", trigger);
    store.bindMenu("user-menu", container);
    store.open("user-menu");

    store.handleWindowOutsideClick({ target: outside } as any as MouseEvent, [
      "user-menu",
      "actions-menu",
    ]);

    expect(store.isOpen("user-menu")).toBe(false);

    outside.remove();
    trigger.remove();
    container.remove();
  });

  it("keeps scroll lock in sync when exclusive closes other menus", () => {
    const scroll = createScrollStoreMock();
    store = createMenuStore({ scroll });
    store.register("user-menu");
    store.register("actions");

    store.open("user-menu");
    expect(scroll.lock).toHaveBeenCalledTimes(1);

    store.open("actions");
    expect(store.isOpen("user-menu")).toBe(false);
    expect(store.isOpen("actions")).toBe(true);
    expect(scroll.lock).toHaveBeenCalledTimes(1);
    expect(scroll.unlock).not.toHaveBeenCalled();

    store.close("actions");
    expect(scroll.unlock).toHaveBeenLastCalledWith("menu-lock");
  });

  it("handles horizontal orientation", () => {
    store = createMenuStore();
    store.register("h-menu", { orientation: "horizontal" });
    store.registerItem("h-menu", "left");
    store.registerItem("h-menu", "right");
    store.open("h-menu");

    store.handleKeydown("h-menu", new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(store.activeItem("h-menu")).toBe("right");

    store.handleKeydown("h-menu", new KeyboardEvent("keydown", { key: "ArrowLeft" }));
    expect(store.activeItem("h-menu")).toBe("left");
  });

  it("navigates to first and last items", () => {
    store.open("user-menu");

    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "End" }));
    expect(store.activeItem("user-menu")).toBe("logout");

    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "Home" }));
    expect(store.activeItem("user-menu")).toBe("profile");
  });

  it("skips disabled items in navigation", () => {
    store.registerItem("user-menu", "disabled-item", { disabled: true });
    store.open("user-menu");

    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "ArrowDown" }));
    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "ArrowDown" }));
    // Should skip disabled-item
    expect(store.activeItem("user-menu")).not.toBe("disabled-item");
  });

  it("handles closeOnSelect: false", () => {
    store.register("actions", { closeOnSelect: false });
    store.registerItem("actions", "save");
    store.open("actions");

    store.handleKeydown("actions", new KeyboardEvent("keydown", { key: "Enter" }));
    expect(store.isOpen("actions")).toBe(true);
  });

  it("calls onOpen and onClose callbacks", () => {
    const onOpen = vi.fn();
    const onClose = vi.fn();
    store.register("callbacks", { onOpen, onClose });
    store.open("callbacks");
    expect(onOpen).toHaveBeenCalled();
    store.close("callbacks");
    expect(onClose).toHaveBeenCalled();
  });

  it("handles unregisterItem", () => {
    store.unregisterItem("user-menu", "profile");
    expect(store.isOpen("user-menu")).toBe(false);
  });

  it("handles unregister of menu", () => {
    store.unregister("user-menu");
    expect(store.isOpen("user-menu")).toBe(false);
  });

  it("handles setActiveItem", () => {
    store.setActiveItem("user-menu", "settings");
    expect(store.activeItem("user-menu")).toBe("settings");
  });

  it("handles setActiveItem on unknown menu", () => {
    store.setActiveItem("nonexistent", "item");
  });

  it("handles setActiveItem on disabled item", () => {
    store.open("user-menu");
    store.registerItem("user-menu", "disabled-item", { disabled: true });
    const before = store.activeItem("user-menu");
    store.setActiveItem("user-menu", "disabled-item");
    // Disabled items can't be set as active
    expect(store.activeItem("user-menu")).toBe(before);
  });

  it("handles ArrowUp navigation", () => {
    store.open("user-menu");
    store.setActiveItem("user-menu", "logout");
    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(store.activeItem("user-menu")).toBe("settings");
  });

  it("handles open on unknown menu", () => {
    store.open("nonexistent");
  });

  it("handles close on unknown menu", () => {
    store.close("nonexistent");
  });

  it("handles toggle on unknown menu", () => {
    store.toggle("nonexistent");
  });

  it("handles handleKeydown on unknown menu", () => {
    store.handleKeydown("nonexistent", new KeyboardEvent("keydown", { key: "Enter" }));
  });

  it("handles handleKeydown when menu is closed", () => {
    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "Enter" }));
  });

  it("handles handleOutsideClick on unknown menu", () => {
    store.handleOutsideClick("nonexistent", {
      target: document.createElement("div"),
    } as any as MouseEvent);
  });

  it("handles handleOutsideClick when target is inside trigger", () => {
    const trigger = document.createElement("button");
    const container = document.createElement("ul");
    document.body.append(trigger, container);

    store.bindTrigger("user-menu", trigger);
    store.bindMenu("user-menu", container);
    store.open("user-menu");

    store.handleOutsideClick("user-menu", { target: trigger } as any as MouseEvent);
    expect(store.isOpen("user-menu")).toBe(true);

    trigger.remove();
    container.remove();
  });

  it("handles handleOutsideClick when target is inside menu", () => {
    const trigger = document.createElement("button");
    const container = document.createElement("ul");
    document.body.append(trigger, container);

    store.bindTrigger("user-menu", trigger);
    store.bindMenu("user-menu", container);
    store.open("user-menu");

    store.handleOutsideClick("user-menu", { target: container } as any as MouseEvent);
    expect(store.isOpen("user-menu")).toBe(true);

    trigger.remove();
    container.remove();
  });

  it("exposes item props for inactive items", () => {
    store.open("user-menu");
    const props = store.itemProps("user-menu", "profile");
    expect(props.tabindex).toBe(0);
  });

  it("handles disabled item props", () => {
    store.registerItem("user-menu", "disabled-item", { disabled: true });
    store.open("user-menu");
    const props = store.itemProps("user-menu", "disabled-item");
    expect(props["aria-disabled"]).toBe(true);
    expect(props.tabindex).toBe(-1);
  });

  it("handles wrap-around in navigation", () => {
    store.open("user-menu");
    store.setActiveItem("user-menu", "logout");
    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(store.activeItem("user-menu")).toBe("profile");
  });

  it("handles unwrap backward navigation", () => {
    store.open("user-menu");
    store.setActiveItem("user-menu", "profile");
    store.handleKeydown("user-menu", new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(store.activeItem("user-menu")).toBe("logout");
  });
});
