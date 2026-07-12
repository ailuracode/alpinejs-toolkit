import Alpine from "alpinejs";
import { afterEach, describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { virtualPlugin } from "../src/plugin.js";
import type { VirtualStore } from "../src/types.js";

describe("@ailuracode/alpine-virtual plugin", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("registers $store.virtual and syncs instances", async () => {
    startAlpine(virtualPlugin());
    await Alpine.nextTick();

    const store = Alpine.store("virtual") as VirtualStore;
    store.create("demo", { count: 20, estimateSize: 24, overscan: 3 });
    await Alpine.nextTick();

    expect(store.instances.demo?.count).toBe(20);
    expect(store.instances.demo?.virtualItems.length).toBeGreaterThan(0);
  });
});
