import Alpine from "alpinejs";
import { afterEach, describe, expect, it, vi } from "vitest";
import menuPlugin, { type MenuStore } from "../src/index.js";

function startMenuAlpine(): MenuStore {
  Alpine.plugin(menuPlugin());
  Alpine.start();
  return Alpine.store("menu") as MenuStore;
}

describe("@ailuracode/alpine-menu teleported menu", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens below the trigger and closes from an outside click", async () => {
    document.body.innerHTML = `
      <div id="overlay-root"></div>
      <div
        x-data="{ ids: ['profile', 'settings'] }"
        x-init="
          $store.menu.register('user-menu');
          ids.forEach(id => $store.menu.registerItem('user-menu', id));
        "
        @click.window="$store.menu.handleWindowOutsideClick($event, ['user-menu'])"
      >
        <div id="trigger-wrap" x-init="$store.menu.bindTrigger('user-menu', $el)">
          <button id="trigger" type="button" @click="$store.menu.toggle('user-menu')">Account</button>
        </div>
        <template x-teleport="#overlay-root">
          <ul id="menu" x-show="$store.menu.isOpen('user-menu')" x-init="$store.menu.bindMenu('user-menu', $el)">
            <li><button type="button" role="menuitem" tabindex="0">profile</button></li>
          </ul>
        </template>
      </div>
    `;

    const store = startMenuAlpine();

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

    expect(store.isOpen("user-menu")).toBe(false);
  });

  it("closes the previous menu when opening another through the Alpine store proxy", async () => {
    document.body.innerHTML = `
      <div id="overlay-root"></div>
      <div
        x-data
        x-init="
          $store.menu.register('user-menu');
          $store.menu.register('actions-menu');
        "
        @keydown.window="$store.menu.handleWindowKeydown($event, ['user-menu', 'actions-menu'])"
      >
        <button id="account" type="button" @click="$store.menu.toggle('user-menu')">Account</button>
        <button id="actions" type="button" @click="$store.menu.toggle('actions-menu')">Actions</button>
      </div>
    `;

    const store = startMenuAlpine();

    document.getElementById("account")?.click();
    await Alpine.nextTick();
    expect(store.isOpen("user-menu")).toBe(true);

    document.getElementById("actions")?.click();
    await Alpine.nextTick();

    expect(store.isOpen("user-menu")).toBe(false);
    expect(store.isOpen("actions-menu")).toBe(true);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await Alpine.nextTick();

    expect(store.isOpen("actions-menu")).toBe(false);
  });
});
