import Alpine from "alpinejs";
import { afterEach, describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { selectionPlugin } from "../src/plugin.js";
import type { SelectionStore } from "../src/types.js";

describe("selection demo x-data scope", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("initializes from x-init expression scope and updates reactively", async () => {
    startAlpine(selectionPlugin());
    document.body.innerHTML = `
      <div
        x-data="{
          items: ['Alpha', 'Bravo'],
          disabled: ['Bravo'],
          mode: 'multiple',
          selectedLabel() {
            const snap = $store.selection.instances.demo;
            if (!snap) return '—';
            return snap.selectedKeys.join(', ') || 'none';
          },
        }"
        x-init="$store.selection.create('demo', { mode, keys: items, disabledKeys: disabled })"
      >
        <p id="label" x-text="selectedLabel()"></p>
        <button id="pick" type="button" @click="$store.selection.replace('demo', 'Alpha')">pick</button>
      </div>
    `;
    await Alpine.nextTick();

    const store = Alpine.store("selection") as SelectionStore;
    expect(store.instances.demo?.mode).toBe("multiple");
    expect(store.instances.demo?.keys).toEqual(["Alpha", "Bravo"]);

    document.getElementById("pick")?.click();
    await Alpine.nextTick();

    expect(store.instances.demo?.selectedKeys).toEqual(["Alpha"]);
    expect(document.getElementById("label")?.textContent).toBe("Alpha");
  });
});
