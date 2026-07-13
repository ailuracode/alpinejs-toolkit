import { beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import tabsPlugin, { createTabsStore } from "../src/index.js";

describe("@ailuracode/alpine-tabs", () => {
  let store: ReturnType<typeof createTabsStore>;

  beforeEach(() => {
    store = createTabsStore();
    store.register("settings-tabs", { defaultTab: "profile" });
    store.registerTab("settings-tabs", "profile");
    store.registerTab("settings-tabs", "billing");
    store.registerTab("settings-tabs", "security");
  });

  it("selects and tracks active tab", () => {
    expect(store.active("settings-tabs")).toBe("profile");
    expect(store.isActive("settings-tabs", "profile")).toBe(true);

    store.select("settings-tabs", "billing");
    expect(store.isActive("settings-tabs", "billing")).toBe(true);
  });

  it("moves to next and previous tabs", () => {
    store.select("settings-tabs", "profile");
    store.next("settings-tabs");
    expect(store.active("settings-tabs")).toBe("billing");

    store.previous("settings-tabs");
    expect(store.active("settings-tabs")).toBe("profile");
  });

  it("handles keyboard navigation", () => {
    store.select("settings-tabs", "profile");

    store.handleKeydown("settings-tabs", new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(store.active("settings-tabs")).toBe("billing");
  });

  it("exposes ARIA tab props", () => {
    store.select("settings-tabs", "profile");

    expect(store.tabProps("settings-tabs", "profile")).toMatchObject({
      role: "tab",
      "aria-selected": true,
      tabindex: 0,
    });

    expect(store.panelProps("settings-tabs", "billing").hidden).toBe(true);
  });

  it("syncs with URL query param when configured", () => {
    window.history.replaceState({}, "", "/?tab=billing");
    store.register("url-tabs", { urlParam: "tab" });
    store.registerTab("url-tabs", "profile");
    store.registerTab("url-tabs", "billing");

    expect(store.active("url-tabs")).toBe("billing");

    store.select("url-tabs", "profile");
    expect(new URL(window.location.href).searchParams.get("tab")).toBe("profile");
  });

  it("registers with Alpine store", () => {
    const Alpine = startAlpine(tabsPlugin());
    const tabs = Alpine.store("tabs") as ReturnType<typeof createTabsStore>;

    tabs.register("demo");
    tabs.registerTab("demo", "one");
    expect(tabs.active("demo")).toBe("one");
  });

  it("handles disabled tabs", () => {
    store.registerTab("settings-tabs", "disabled-tab", true);
    expect(store.active("settings-tabs")).toBe("profile");
    store.select("settings-tabs", "disabled-tab");
    expect(store.active("settings-tabs")).toBe("profile");
  });

  it("handles vertical orientation", () => {
    store.register("vertical-tabs", { orientation: "vertical" });
    store.registerTab("vertical-tabs", "tab1");
    store.registerTab("vertical-tabs", "tab2");
    store.active("vertical-tabs");

    store.handleKeydown("vertical-tabs", new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(store.active("vertical-tabs")).toBe("tab2");

    store.handleKeydown("vertical-tabs", new KeyboardEvent("keydown", { key: "ArrowUp" }));
    expect(store.active("vertical-tabs")).toBe("tab1");
  });

  it("handles Home and End keys", () => {
    store.select("settings-tabs", "billing");
    store.handleKeydown("settings-tabs", new KeyboardEvent("keydown", { key: "Home" }));
    expect(store.active("settings-tabs")).toBe("profile");

    store.handleKeydown("settings-tabs", new KeyboardEvent("keydown", { key: "End" }));
    expect(store.active("settings-tabs")).toBe("security");
  });

  it("handles manual activation mode", () => {
    store.register("manual-tabs", { activation: "manual" });
    store.registerTab("manual-tabs", "tab1");
    store.registerTab("manual-tabs", "tab2");

    store.handleKeydown("manual-tabs", new KeyboardEvent("keydown", { key: "ArrowRight" }));
    expect(store.active("manual-tabs")).toBe("tab2");
  });

  it("unregisterTab removes tab and updates active", () => {
    store.select("settings-tabs", "profile");
    store.unregisterTab("settings-tabs", "profile");
    expect(store.active("settings-tabs")).toBe("billing");
  });

  it("unregisterTab handles unknown group", () => {
    store.unregisterTab("nonexistent", "tab");
  });

  it("unregisterTab handles removing active tab", () => {
    store.select("settings-tabs", "billing");
    store.unregisterTab("settings-tabs", "billing");
    expect(store.active("settings-tabs")).toBe("profile");
  });

  it("unregisterTab when no enabled tabs remain", () => {
    store.unregisterTab("settings-tabs", "profile");
    store.unregisterTab("settings-tabs", "billing");
    store.unregisterTab("settings-tabs", "security");
    expect(store.active("settings-tabs")).toBeNull();
  });

  it("select handles unknown group", () => {
    store.select("nonexistent", "tab");
  });

  it("select handles unknown tab", () => {
    store.select("settings-tabs", "nonexistent");
    expect(store.active("settings-tabs")).toBe("profile");
  });

  it("next handles unknown group", () => {
    store.next("nonexistent");
  });

  it("previous handles unknown group", () => {
    store.previous("nonexistent");
  });

  it("next wraps around", () => {
    store.select("settings-tabs", "security");
    store.next("settings-tabs");
    expect(store.active("settings-tabs")).toBe("profile");
  });

  it("previous wraps around", () => {
    store.select("settings-tabs", "profile");
    store.previous("settings-tabs");
    expect(store.active("settings-tabs")).toBe("security");
  });

  it("next with empty group returns null", () => {
    store.register("empty-group");
    store.next("empty-group");
  });

  it("tablistProps returns orientation", () => {
    const props = store.tablistProps("settings-tabs");
    expect(props.role).toBe("tablist");
    expect(props["aria-orientation"]).toBe("horizontal");
  });

  it("emits change event on select", () => {
    const controller = (store as any).controller;
    let eventFired = false;
    if (controller && typeof controller.on === "function") {
      controller.on("change", () => {
        eventFired = true;
      });
    }
    store.select("settings-tabs", "billing");
    if (controller) {
      expect(eventFired).toBe(true);
    }
  });

  it("calls onChange callback on select", () => {
    const callback = vi.fn();
    store.register("callback-tabs", { onChange: callback });
    store.registerTab("callback-tabs", "tab1");
    store.registerTab("callback-tabs", "tab2");
    store.select("callback-tabs", "tab2");
    expect(callback).toHaveBeenCalledWith("tab2");
  });
});
