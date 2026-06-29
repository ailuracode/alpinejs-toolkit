import Alpine from "alpinejs";
import { afterEach, describe, expect, it, vi } from "vitest";
import menuPlugin from "../src/index.js";

describe("@ailuracode/alpine-menu teleported menu", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens below the trigger and closes from an outside click", async () => {
    document.body.innerHTML = `
      <div
        x-data="{ ids: ['profile', 'settings'] }"
        x-init="
          $store.menu.register('user-menu');
          ids.forEach(id => $store.menu.registerItem('user-menu', id));
        "
        @click.window="$store.menu.handleOutsideClick('user-menu', $event)"
      >
        <div id="trigger-wrap" x-init="$store.menu.bindTrigger('user-menu', $el)">
          <button id="trigger" type="button" @click="$store.menu.toggle('user-menu')">Account</button>
        </div>
        <template x-teleport="body">
          <ul id="menu" x-show="$store.menu.isOpen('user-menu')" x-init="$store.menu.bindMenu('user-menu', $el)">
            <li><button type="button" role="menuitem" tabindex="0">profile</button></li>
          </ul>
        </template>
      </div>
    `;

    Alpine.plugin(menuPlugin());
    Alpine.start();

    const trigger = document.getElementById("trigger-wrap");
    if (!trigger) {
      throw new Error("Expected trigger wrapper");
    }

    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      bottom: 80,
      left: 24,
      width: 96,
    } as DOMRect);

    document.getElementById("trigger")?.click();
    await Alpine.nextTick();
    await Promise.resolve();

    const menu = document.getElementById("menu");
    expect(menu?.style.display).not.toBe("none");

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await Alpine.nextTick();

    const store = Alpine.store("menu") as { isOpen(id: string): boolean };
    expect(store.isOpen("user-menu")).toBe(false);
  });
});
