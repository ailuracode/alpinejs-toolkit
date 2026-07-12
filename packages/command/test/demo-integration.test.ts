import commandPlugin from "@ailuracode/alpine-command";
import overlayPlugin from "@ailuracode/alpine-overlay";
import Alpine from "alpinejs";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("command demo integration", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div x-data="commandDemo" @keydown.window="handleGlobalKey($event)">
        <button id="open" @click="$store.command.open()">Open</button>
        <template x-teleport="body">
          <div x-show="$store.command.isOpen" id="palette">
            <input
              x-model="$store.command.search"
              x-bind="$store.command.inputProps()"
              data-command-search
            />
            <ul x-bind="$store.command.listboxProps()">
              <template x-for="(entry, index) in $store.command.visibleItems" :key="entry.id">
                <li>
                  <button
                    x-bind="$store.command.optionProps(entry.id)"
                    @click="$store.command.run(entry.id)"
                    x-text="entry.item.label"
                  ></button>
                </li>
              </template>
            </ul>
          </div>
        </template>
      </div>
    `;

    Alpine.plugin(overlayPlugin());
    Alpine.plugin(commandPlugin());
    Alpine.data("commandDemo", () => ({
      init() {
        const command = Alpine.store("command") as {
          register(item: { id: string; label: string; group: string; action: () => void }): void;
        };
        command.register({
          id: "toggle-theme",
          label: "Toggle theme",
          group: "Appearance",
          action: vi.fn(),
        });
      },
      handleGlobalKey(event: KeyboardEvent) {
        const command = Alpine.store("command") as {
          isOpen: boolean;
          toggle(): void;
          handleKeydown(event: KeyboardEvent): void;
        };
        const isMod = event.metaKey || event.ctrlKey;
        if (isMod && event.key.toLowerCase() === "k") {
          event.preventDefault();
          command.toggle();
          return;
        }
        if (command.isOpen) {
          command.handleKeydown(event);
        }
      },
    }));

    Alpine.start();
  });

  it("opens the palette and lists registered commands", async () => {
    document.querySelector<HTMLButtonElement>("#open")?.click();
    await vi.waitFor(() => {
      expect(document.querySelector("#palette")?.checkVisibility?.() ?? true).toBe(true);
    });

    const labels = [...document.querySelectorAll("#palette [role='option']")].map(
      (button) => button.textContent
    );
    expect(labels).toContain("Toggle theme");
  });
});
