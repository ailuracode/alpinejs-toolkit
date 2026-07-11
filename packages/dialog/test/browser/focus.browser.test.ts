/**
 * Real-browser accessibility contract for `@ailuracode/alpine-dialog`.
 *
 * happy-dom cannot model real focus movement, so focus capture/restore and the
 * focus trap are validated here in Chromium (ALP-23). These tests require a
 * browser provider — run via `pnpm run test:browser` (CI installs Chromium).
 */
import Alpine from "alpinejs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import dialogPlugin from "../../src/index.js";

describe("@ailuracode/alpine-dialog — focus (real browser)", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="trigger" type="button">Open</button>
      <div id="panel" x-data x-show="$store.dialog.isOpen('d')" tabindex="-1">
        <button id="first" type="button">First</button>
        <button id="last" type="button">Last</button>
      </div>
    `;
    Alpine.plugin(dialogPlugin());
    Alpine.plugin((alpine) => {
      /** @ts-expect-error - Alpine.store is not typed. */
      alpine.store("dialog").register("d", { trigger: document.getElementById("trigger") });
    });
    Alpine.start();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("captures focus into the panel on open and restores it to the trigger on close", async () => {
    document.getElementById("trigger")?.click();
    await Alpine.nextTick();

    const panel = document.getElementById("panel");
    expect(panel?.style.display).not.toBe("none");
    // Focus should land on the first focusable element inside the panel.
    expect(document.activeElement?.id).toBe("first");

    document.getElementById("last")?.focus();
    document.getElementById("trigger")?.click();
    await Alpine.nextTick();

    // Closing restores focus to the element that opened the dialog.
    expect(document.activeElement?.id).toBe("trigger");
  });

  it("traps Tab focus within the panel", async () => {
    document.getElementById("trigger")?.click();
    await Alpine.nextTick();

    const panel = document.getElementById("panel");
    expect(panel).toBeTruthy();

    // Move to the last focusable element and Tab forward — focus must wrap.
    document.getElementById("last")?.focus();
    const tabForward = new KeyboardEvent("keydown", { key: "Tab", bubbles: true });
    panel?.dispatchEvent(tabForward);
    await Alpine.nextTick();
    expect(document.activeElement?.id).toBe("first");

    // Shift+Tab from the first element must wrap to the last.
    document.getElementById("first")?.focus();
    const tabBack = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
    panel?.dispatchEvent(tabBack);
    await Alpine.nextTick();
    expect(document.activeElement?.id).toBe("last");
  });
});
