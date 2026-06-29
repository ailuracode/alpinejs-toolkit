import Alpine from "alpinejs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import tooltipPlugin from "../src/index.js";

describe("@ailuracode/alpine-tooltip reactivity", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div
        x-data="{ id: 'tip-top' }"
        x-init="$store.tooltip.register(id, { openDelay: 80, closeDelay: 80 })"
      >
        <button
          id="trigger"
          @mouseenter="$store.tooltip.showOnHover(id)"
        ></button>
        <strong id="state" x-text="$store.tooltip.isOpen(id) ? 'open' : 'closed'"></strong>
      </div>
    `;

    Alpine.plugin(tooltipPlugin());
    Alpine.start();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("updates the dom when open state changes after x-init register and delay", async () => {
    expect(document.getElementById("state")?.textContent).toBe("closed");

    document
      .getElementById("trigger")
      ?.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Alpine.nextTick();

    expect(document.getElementById("state")?.textContent).toBe("open");
  });
});
