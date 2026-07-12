import commandPlugin from "@ailuracode/alpine-command";
import overlayPlugin from "@ailuracode/alpine-overlay";
import Alpine from "alpinejs";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("command demo markup", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="overlay-root"></div>
      <div x-data="commandDemo" @keydown.window="handleGlobalKey($event)">
        <button id="open" @click="$store.command.open()">Open</button>
        <template x-teleport="#overlay-root">
          <div x-show="$store.command.isOpen" id="palette">
            <input
              type="search"
              data-command-search
              x-model="$store.command.search"
              x-bind="$store.command.inputProps()"
            />
            <ul x-bind="$store.command.listboxProps()">
              <template x-for="(entry, index) in $store.command.visibleItems" :key="entry.id">
                <li>
                  <button
                    type="button"
                    :class="index === $store.command.activeIndex ? 'active' : ''"
                    :disabled="entry.disabled || entry.loading"
                    x-bind="$store.command.optionProps(entry.id)"
                    @click="!entry.disabled && $store.command.run(entry.id)"
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
          register(item: {
            id: string;
            label: string;
            group: string;
            disabled?: boolean;
            action: () => void;
          }): void;
        };
        command.register({
          id: "toggle-theme",
          label: "Toggle theme",
          group: "Appearance",
          action: vi.fn(),
        });
        command.register({
          id: "disabled-demo",
          label: "Disabled action",
          group: "Actions",
          disabled: true,
          action: vi.fn(),
        });
      },
      handleGlobalKey(_event: KeyboardEvent) {
        return;
      },
    }));

    Alpine.start();
  });

  it("renders visible and disabled commands", async () => {
    document.querySelector<HTMLButtonElement>("#open")?.click();
    await vi.waitFor(() => {
      expect(document.querySelectorAll("#palette [role='option']").length).toBeGreaterThan(0);
    });

    const labels = [...document.querySelectorAll("#palette [role='option']")].map(
      (button) => button.textContent
    );
    expect(labels).toContain("Toggle theme");
    expect(labels).toContain("Disabled action");
  });
});
