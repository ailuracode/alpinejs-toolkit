import Alpine from "alpinejs";
import { afterEach, describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import accordionPlugin from "../src/index.js";

describe("@ailuracode/alpine-accordion reactivity", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("shows default open state in the dom on init", async () => {
    startAlpine(accordionPlugin());

    document.body.innerHTML = `
      <div
        x-data
        x-init="
          $store.accordion.register('faq', { mode: 'single', defaultOpen: 'item-2' });
          ['item-1', 'item-2'].forEach((id) => $store.accordion.registerItem('faq', id));
        "
      >
        <strong id="open-ids" x-text="$store.accordion.openIds('faq').join(', ') || '—'"></strong>
        <div id="panel-b" x-show="$store.accordion.isOpen('faq', 'item-2')">b</div>
      </div>
    `;

    await Alpine.nextTick();

    expect(document.getElementById("open-ids")?.textContent).toBe("item-2");
    expect(document.getElementById("panel-b")?.style.display).not.toBe("none");
  });

  it("updates openIds and panels across repeated toggles", async () => {
    startAlpine(accordionPlugin());

    document.body.innerHTML = `
      <div
        x-data
        x-init="
          $store.accordion.register('faq', { mode: 'single', defaultOpen: 'item-2' });
          ['item-1', 'item-2'].forEach((id) => $store.accordion.registerItem('faq', id));
        "
      >
        <button id="toggle-a" type="button" @click="$store.accordion.toggle('faq', 'item-1')">A</button>
        <button id="toggle-b" type="button" @click="$store.accordion.toggle('faq', 'item-2')">B</button>
        <strong id="open-ids" x-text="$store.accordion.openIds('faq').join(', ') || '—'"></strong>
        <div id="panel-a" x-show="$store.accordion.isOpen('faq', 'item-1')">a</div>
        <div id="panel-b" x-show="$store.accordion.isOpen('faq', 'item-2')">b</div>
      </div>
    `;

    await Alpine.nextTick();

    document.getElementById("toggle-a")?.click();
    await Alpine.nextTick();

    expect(document.getElementById("open-ids")?.textContent).toBe("item-1");
    expect(document.getElementById("panel-a")?.style.display).not.toBe("none");
    expect(document.getElementById("panel-b")?.style.display).toBe("none");

    document.getElementById("toggle-a")?.click();
    await Alpine.nextTick();

    expect(document.getElementById("open-ids")?.textContent).toBe("—");
    expect(document.getElementById("panel-a")?.style.display).toBe("none");

    document.getElementById("toggle-b")?.click();
    await Alpine.nextTick();

    expect(document.getElementById("open-ids")?.textContent).toBe("item-2");
    expect(document.getElementById("panel-b")?.style.display).not.toBe("none");
  });
});
