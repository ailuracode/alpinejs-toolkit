import Alpine from "alpinejs";
import { afterEach, describe, expect, it } from "vitest";
import { registerSelectionDemo } from "../../../apps/demo/src/demo/selection-demo.js";
import { startAlpine } from "../../../test/helpers.js";
import { selectionPlugin } from "../src/plugin.js";
import type { SelectionStore } from "../src/types.js";

const demoMarkup = `
  <div class="grid gap-8" x-data="selectionDemo">
    <p id="label" x-text="\`Selected: \${$store.selection.instances.demo?.selectedKeys.join(', ') || 'none'}\`"></p>
    <p id="mode" x-text="$store.selection.instances.demo?.mode"></p>
    <p id="active" x-text="$store.selection.instances.demo?.activeKey ?? '—'"></p>
    <button id="single" type="button" @click="setMode('single')">single</button>
    <ul x-bind="$store.selection.listProps('demo', { label: 'Selection demo' })">
      <template x-for="item in items" :key="item">
        <li role="presentation">
          <button
            type="button"
            :id="'item-' + item"
            x-bind="$store.selection.itemProps('demo', item)"
            :class="itemClass(item)"
            :disabled="$store.selection.instances.demo?.disabledKeys.includes(item)"
            @click="pick($event, item)"
            x-text="item"
          ></button>
        </li>
      </template>
    </ul>
  </div>
`;

describe("selection demo interaction", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("updates selection when option buttons are clicked", async () => {
    startAlpine(selectionPlugin());
    registerSelectionDemo(Alpine);
    document.body.innerHTML = demoMarkup;
    await Alpine.nextTick();

    document.getElementById("item-Alpha")?.click();
    await Alpine.nextTick();

    const store = Alpine.store("selection") as SelectionStore;
    expect(store.instances.demo?.selectedKeys).toEqual(["Alpha"]);
    expect(document.getElementById("label")?.textContent).toBe("Selected: Alpha");
    expect(document.getElementById("active")?.textContent).toBe("Alpha");
  });

  it("updates mode and selects in single mode", async () => {
    startAlpine(selectionPlugin());
    registerSelectionDemo(Alpine);
    document.body.innerHTML = demoMarkup;
    await Alpine.nextTick();

    document.getElementById("single")?.click();
    await Alpine.nextTick();
    expect(document.getElementById("mode")?.textContent).toBe("single");

    document.getElementById("item-Bravo")?.click();
    await Alpine.nextTick();

    expect(document.getElementById("label")?.textContent).toBe("Selected: Bravo");
  });

  it("does not select disabled keys", async () => {
    startAlpine(selectionPlugin());
    registerSelectionDemo(Alpine);
    document.body.innerHTML = demoMarkup;
    await Alpine.nextTick();

    document.getElementById("item-Charlie")?.click();
    await Alpine.nextTick();

    expect(document.getElementById("label")?.textContent).toBe("Selected: none");
  });
});
