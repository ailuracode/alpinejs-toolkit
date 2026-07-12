import Alpine from "alpinejs";
import { afterEach, describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { selectionPlugin } from "../src/plugin.js";
import type { SelectionStore } from "../src/types.js";

describe("@ailuracode/alpine-selection plugin", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registers $store.selection and syncs instances", async () => {
    startAlpine(selectionPlugin());
    await Alpine.nextTick();

    const store = Alpine.store("selection") as SelectionStore;
    store.create("demo", { mode: "single", keys: ["a", "b"] });
    store.replace("demo", "a");
    await Alpine.nextTick();

    expect(store.instances.demo?.value).toBe("a");
    expect(store.isSelected("demo", "a")).toBe(true);
  });
});
