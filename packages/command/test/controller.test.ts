import type { ScrollStore } from "@ailuracode/alpine-scroll";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CommandController } from "../src/controller.js";
import type { CommandItem } from "../src/types.js";

function createScrollStoreMock(): ScrollStore {
  return {
    lock: vi.fn(() => "command-lock"),
    unlock: vi.fn(),
  } as unknown as ScrollStore;
}

function createItem(
  overrides: Partial<CommandItem> & Pick<CommandItem, "id" | "label">
): CommandItem {
  return {
    action: vi.fn(),
    ...overrides,
  };
}

describe("CommandController", () => {
  let controller: CommandController;

  beforeEach(() => {
    controller = new CommandController();
    controller.register(
      createItem({
        id: "toggle-theme",
        label: "Toggle theme",
        group: "Appearance",
        shortcut: "⌘K",
        keywords: ["dark"],
      })
    );
    controller.register(
      createItem({
        id: "open-settings",
        label: "Open settings",
        group: "General",
      })
    );
  });

  it("opens, toggles, and closes the palette", () => {
    expect(controller.isOpen).toBe(false);
    controller.open();
    expect(controller.isOpen).toBe(true);
    controller.toggle();
    expect(controller.isOpen).toBe(false);
  });

  it("returns an unregister callback from register()", () => {
    const unregister = controller.register(createItem({ id: "save", label: "Save" }));
    expect(controller.filteredItems.some((item) => item.id === "save")).toBe(true);
    unregister();
    expect(controller.filteredItems.some((item) => item.id === "save")).toBe(false);
  });

  it("ranks label prefix matches ahead of keyword matches", () => {
    controller.register(
      createItem({ id: "theme-export", label: "Export theme", keywords: ["toggle"] })
    );
    controller.search = "toggle";
    expect(controller.filteredItems[0]?.id).toBe("toggle-theme");
  });

  it("matches aliases and keywords", () => {
    controller.register(
      createItem({
        id: "alias-cmd",
        label: "Palette action",
        aliases: ["spotlight"],
        keywords: ["search"],
      })
    );
    controller.search = "spot";
    expect(controller.filteredItems.map((item) => item.id)).toEqual(["alias-cmd"]);
  });

  it("keeps disabled commands visible but not selectable", () => {
    controller.register(createItem({ id: "disabled", label: "Disabled action", disabled: true }));
    expect(controller.filteredItems.map((item) => item.id)).toContain("disabled");
    expect(controller.itemState("disabled")?.selectable).toBe(false);
  });

  it("evaluates dynamic disabled predicates reactively", () => {
    let blocked = true;
    controller.register(
      createItem({
        id: "dynamic",
        label: "Dynamic action",
        disabled: () => blocked,
      })
    );

    expect(controller.itemState("dynamic")?.disabled).toBe(true);
    blocked = false;
    expect(controller.itemState("dynamic")?.disabled).toBe(false);
  });

  it("hides commands when hidden predicate is true", () => {
    controller.register(createItem({ id: "hidden", label: "Hidden action", hidden: true }));
    expect(controller.filteredItems.some((item) => item.id === "hidden")).toBe(false);
  });

  it("skips disabled commands during keyboard navigation", () => {
    controller.register(createItem({ id: "disabled", label: "Disabled action", disabled: true }));
    controller.open();
    controller.handleKeydown(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(controller.filteredItems[controller.activeIndex]?.id).not.toBe("disabled");
  });

  it("runs async commands once and ignores stale runs after cancelRun()", async () => {
    let resolveFirst: (() => void) | undefined;
    const first = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFirst = resolve;
        })
    );
    const second = vi.fn(async () => undefined);

    controller.register(createItem({ id: "async", label: "Async action", action: first }));
    controller.register(createItem({ id: "sync", label: "Sync action", action: second }));

    const pending = controller.run("async");
    controller.cancelRun();
    resolveFirst?.();
    await pending;

    await controller.run("sync");
    expect(second).toHaveBeenCalledOnce();
  });

  it("loads nested pages and supports back navigation", async () => {
    const loader = vi.fn(() => {
      controller.register(createItem({ id: "child", label: "Child action", page: "settings" }));
    });

    await controller.pushPage({ id: "settings", title: "Settings", load: loader });
    expect(loader).toHaveBeenCalledOnce();
    expect(controller.filteredItems.map((item) => item.id)).toEqual(["child"]);

    controller.goBack();
    expect(controller.currentPageId).toBe("root");
    expect(controller.filteredItems.map((item) => item.id)).not.toContain("child");
  });

  it("records recent commands through persistence hooks", async () => {
    const setRecent = vi.fn();
    const recentController = new CommandController(undefined, {
      persistence: { setRecent, maxRecent: 2 },
    });
    recentController.register(createItem({ id: "a", label: "A" }));
    recentController.register(createItem({ id: "b", label: "B" }));

    await recentController.run("a");
    await recentController.run("b");
    expect(setRecent).toHaveBeenLastCalledWith(["b", "a"]);
  });

  it("exposes combobox/listbox ARIA props", () => {
    controller.open();
    const activeId = controller.visibleItems[controller.activeIndex]?.id ?? "toggle-theme";
    expect(controller.inputProps()).toMatchObject({
      role: "combobox",
      "aria-expanded": true,
      "aria-autocomplete": "list",
    });
    expect(controller.listboxProps()).toMatchObject({ role: "listbox" });
    expect(controller.optionProps(activeId)).toMatchObject({
      role: "option",
      "aria-selected": true,
    });
  });

  it("cleans up on destroy()", () => {
    const unregister = controller.register(createItem({ id: "temp", label: "Temp" }));
    controller.open();
    controller.destroy();
    unregister();
    expect(controller.isDestroyed).toBe(true);
    expect(controller.isOpen).toBe(false);
  });

  it("locks and unlocks scroll when a scroll store is provided", () => {
    const scroll = createScrollStoreMock();
    const lockedController = new CommandController(undefined, { scroll, scrollLock: true });
    lockedController.register(createItem({ id: "save", label: "Save" }));

    lockedController.open();
    expect(scroll.lock).toHaveBeenCalledWith("command");

    lockedController.close();
    expect(scroll.unlock).toHaveBeenCalledWith("command-lock");
  });

  it("skips scroll lock when scrollLock is disabled", () => {
    const scroll = createScrollStoreMock();
    const unlockedController = new CommandController(undefined, { scroll, scrollLock: false });

    unlockedController.open();
    expect(scroll.lock).not.toHaveBeenCalled();
  });
});
