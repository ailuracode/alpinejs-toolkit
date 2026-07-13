import { describe, expect, it } from "vitest";
import { SelectionController } from "../src/controller.js";
import {
  createSelectionStore,
  createSelectionStoreFromController,
  syncInstanceRegistry,
} from "../src/store.js";

describe("@ailuracode/alpine-selection store", () => {
  it("createSelectionStore creates a working store", () => {
    const store = createSelectionStore();
    store.create("list", { mode: "single", keys: ["a", "b", "c"] });
    expect(store.instances.list).toBeDefined();
    store.replace("list", "b");
    expect(store.isSelected("list", "b")).toBe(true);
  });

  it("store.syncs instances record after mutations", () => {
    const store = createSelectionStore();
    store.create("list", { mode: "multiple", keys: ["a", "b"] });
    expect(store.instances.list).toBeDefined();
    store.toggle("list", "a");
    expect(store.instances.list.value).toEqual(["a"]);
    store.destroy("list");
    expect(store.instances.list).toBeUndefined();
  });

  it("store exposes snapshots via getSnapshot", () => {
    const store = createSelectionStore();
    store.create("list", { mode: "single", keys: ["a", "b"] });
    store.replace("list", "a");
    const snapshot = store.getSnapshot("list");
    expect(snapshot.mode).toBe("single");
    expect(snapshot.value).toBe("a");
  });

  it("store listProps and itemProps work from cached snapshot", () => {
    const store = createSelectionStore();
    store.create("list", { mode: "multiple", keys: ["a", "b"] });
    store.toggle("list", "a");
    const listProps = store.listProps("list", { label: "Items" });
    expect(listProps.role).toBe("listbox");
    expect(listProps["aria-multiselectable"]).toBe(true);
    const itemProps = store.itemProps("list", "a");
    expect(itemProps["aria-selected"]).toBe(true);
    expect(itemProps["data-selection-key"]).toBe("a");
  });

  it("store delegates to controller when snapshot not yet synced", () => {
    const controller = new SelectionController();
    controller.create("list", { mode: "single", keys: ["a"] });
    const store = createSelectionStoreFromController(controller);
    const listProps = store.listProps("list");
    expect(listProps.role).toBe("listbox");
  });

  it("createSelectionStoreFromController mirrors existing controller", () => {
    const controller = new SelectionController();
    controller.create("a", { mode: "single", keys: ["x", "y"] });
    controller.create("b", { mode: "multiple", keys: ["x", "y"] });
    const store = createSelectionStoreFromController(controller);
    controller.replace("a", "x");
    expect(store.instances.a).toBeDefined();
    expect(store.instances.b).toBeDefined();
    expect(store.getSnapshot("a").value).toBe("x");
  });

  it("syncInstanceRegistry adds, updates, and removes entries", () => {
    const target = {} as Record<string, unknown>;
    const snapshot = { a: { mode: "single" }, b: { mode: "multiple" } } as Record<string, unknown>;
    syncInstanceRegistry(target as Record<string, never>, snapshot as Record<string, never>);
    expect(target.a).toEqual({ mode: "single" });
    expect(target.b).toEqual({ mode: "multiple" });
    expect(target.old).toBeUndefined();
  });

  it("destroyAll clears all instances from store", () => {
    const store = createSelectionStore();
    store.create("a", { mode: "single", keys: ["x"] });
    store.create("b", { mode: "single", keys: ["y"] });
    store.destroyAll();
    expect(store.instances.a).toBeUndefined();
    expect(store.instances.b).toBeUndefined();
    expect(Object.keys(store.instances)).toHaveLength(0);
  });

  it("store setKeys, setDisabledKeys, setMode update snapshot", () => {
    const store = createSelectionStore();
    store.create("list", { mode: "multiple", keys: ["a", "b", "c"] });
    store.toggle("list", "a");
    store.toggle("list", "b");
    store.setKeys("list", ["a", "c"]);
    expect(store.getSnapshot("list").keys).toEqual(["a", "c"]);
    expect(store.isSelected("list", "a")).toBe(true);
    expect(store.isSelected("list", "b")).toBe(false);

    store.setDisabledKeys("list", ["a"]);
    expect(store.isSelectable("list", "a")).toBe(false);

    store.setMode("list", "single");
    expect(store.getSnapshot("list").mode).toBe("single");
  });
});
