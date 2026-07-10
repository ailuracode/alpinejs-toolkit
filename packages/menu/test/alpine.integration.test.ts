import Alpine from "alpinejs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import menuPlugin from "../src/index.js";

describe("@ailuracode/alpine-menu alpine integration", () => {
  beforeEach(() => {
    // `startAlpine` registers the plugin AND calls `Alpine.start()` only on
    // the first call (gated by a module-level `alpineStarted` flag). Calling
    // `Alpine.start()` again on every test makes Alpine emit the
    // "already been initialized" warning and can leak state between tests.
    // Must run BEFORE the test HTML is mounted: the helper overwrites
    // `document.body.innerHTML` with a placeholder on every call, and
    // `Alpine.start()` arms the mutation observer that processes the
    // markup we set right after.
    startAlpine(menuPlugin());

    document.body.innerHTML = `
      <div
        x-data="{ ids: ['profile', 'settings'] }"
        x-init="
          $store.menu.register('user-menu');
          ids.forEach(id => $store.menu.registerItem('user-menu', id));
        "
        @keydown.window="$store.menu.isOpen('user-menu') && $store.menu.handleKeydown('user-menu', $event)"
      >
        <div id="menu-root">
          <button id="trigger" type="button" @click="$store.menu.toggle('user-menu')">Account</button>
          <ul id="menu" x-show="$store.menu.isOpen('user-menu')">
            <template x-for="id in ids" :key="id">
              <li>
                <button
                  type="button"
                  :id="'item-' + id"
                  @click="$store.menu.selectItem('user-menu', id)"
                  x-text="id"
                ></button>
              </li>
            </template>
          </ul>
        </div>
        <strong id="open-state" x-text="$store.menu.isOpen('user-menu')"></strong>
      </div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens when the trigger is clicked and stays open", async () => {
    expect(document.getElementById("open-state")?.textContent).toBe("");

    document.getElementById("trigger")?.click();
    await Alpine.nextTick();

    expect(document.getElementById("open-state")?.textContent).toBe("true");
    expect(document.getElementById("menu")?.style.display).not.toBe("none");
  });

  it("moves the active item with arrow keys via window keydown", async () => {
    document.getElementById("trigger")?.click();
    await Alpine.nextTick();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await Alpine.nextTick();
    await Promise.resolve();

    const store = Alpine.store("menu") as { activeItem(id: string): string | null };
    expect(store.activeItem("user-menu")).toBe("settings");
    expect(document.getElementById("open-state")?.textContent).toBe("true");
  });

  it("selects an item and closes the menu", async () => {
    document.getElementById("trigger")?.click();
    await Alpine.nextTick();

    document.getElementById("item-settings")?.click();
    await Alpine.nextTick();

    const store = Alpine.store("menu") as {
      isOpen(id: string): boolean;
      activeItem(id: string): string | null;
    };

    expect(store.activeItem("user-menu")).toBe("settings");
    expect(store.isOpen("user-menu")).toBe(false);
  });
});
