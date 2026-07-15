import Alpine from "alpinejs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import accordionPlugin from "../src/index.js";

describe("@ailuracode/alpine-accordion alpine integration", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div
        x-data
        x-init="
          $store.accordion.register('faq');
          $store.accordion.registerItem('faq', 'item-1');
        "
      >
        <button id="toggle" type="button" @click="$store.accordion.toggle('faq', 'item-1')">Toggle</button>
        <strong id="state-method" x-text="$store.accordion.isOpen('faq', 'item-1')"></strong>
        <strong id="state-prop" x-text="$store.accordion.groups.faq?.open['item-1']"></strong>
        <div id="panel" x-show="$store.accordion.isOpen('faq', 'item-1')">panel</div>
      </div>
    `;

    Alpine.plugin(accordionPlugin());
    Alpine.start();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("updates the dom when an item opens", async () => {
    expect(document.getElementById("panel")?.style.display).toBe("none");

    document.getElementById("toggle")?.click();
    await Alpine.nextTick();

    const store = Alpine.store("accordion") as {
      groups: Record<string, { open: Record<string, boolean> }>;
    };
    expect(store.groups.faq?.open["item-1"]).toBe(true);
    expect(document.getElementById("state-method")?.textContent).toBe("true");
    expect(document.getElementById("state-prop")?.textContent).toBe("true");
    expect(document.getElementById("panel")?.style.display).not.toBe("none");
  });
});
