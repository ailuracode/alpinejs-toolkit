import Alpine from "alpinejs";
import { afterEach, describe, expect, it } from "vitest";
import dialogPlugin from "../src/index.js";

describe("@ailuracode/alpine-dialog x-teleport integration", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("closes when the close button is clicked inside a teleported dialog", async () => {
    document.body.innerHTML = `
      <div id="overlay-root"></div>
      <div x-data x-init="$store.dialog.register('settings')">
        <button id="open" type="button" @click="$store.dialog.open('settings')">Open</button>
        <template x-teleport="#overlay-root">
          <div x-show="$store.dialog.isOpen('settings')" class="fixed inset-0 z-50">
            <div
              x-init="$store.dialog.bindContainer('settings', $el)"
            >
              <button id="close" type="button" @click="$store.dialog.close('settings')">Close</button>
            </div>
          </div>
        </template>
      </div>
    `;

    const register = dialogPlugin();
    Alpine.plugin(register);
    Alpine.start();

    document.getElementById("open")?.click();
    await Alpine.nextTick();

    const store = Alpine.store("dialog") as { isOpen(id: string): boolean };
    expect(store.isOpen("settings")).toBe(true);

    document.getElementById("close")?.click();
    await Alpine.nextTick();

    expect(store.isOpen("settings")).toBe(false);
  });
});
