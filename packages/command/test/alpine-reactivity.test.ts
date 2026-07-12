import commandPlugin from "@ailuracode/alpine-command";
import Alpine from "alpinejs";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("command alpine reactivity", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div x-data>
        <span id="count" x-text="$store.command.visibleItems.length"></span>
        <span id="open" x-text="$store.command.isOpen"></span>
        <button id="toggle" @click="$store.command.toggle()">Toggle</button>
        <input id="search" x-model="$store.command.search" />
      </div>
    `;

    Alpine.plugin(commandPlugin());
    Alpine.start();

    const command = Alpine.store("command") as {
      register(item: { id: string; label: string; action: () => void }): void;
    };
    command.register({ id: "alpha", label: "Alpha", action: vi.fn() });
    command.register({ id: "beta", label: "Beta", action: vi.fn() });
  });

  it("updates isOpen in the template when toggled", async () => {
    document.querySelector<HTMLButtonElement>("#toggle")?.click();
    await vi.waitFor(() => {
      expect(document.querySelector("#open")?.textContent).toBe("true");
    });
  });

  it("updates visibleItems length when search changes", async () => {
    const search = document.querySelector<HTMLInputElement>("#search");
    expect(search).not.toBeNull();
    if (!search) {
      return;
    }
    search.value = "alpha";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => {
      expect(document.querySelector("#count")?.textContent).toBe("1");
    });
  });
});
