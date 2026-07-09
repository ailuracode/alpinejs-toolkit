import Alpine from "alpinejs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import toastPlugin, { type ToastStore } from "../src/index.js";

const integrationPlugin = () =>
  toastPlugin({
    variants: ["success", "loading"] as const,
    promise: {
      loadingVariant: "loading",
      successVariant: "success",
    },
  });

describe("@ailuracode/alpine-toast alpine integration", () => {
  beforeEach(() => {
    // `startAlpine` registers the plugin and only calls `Alpine.start()`
    // on the first invocation (gated by a module-level `alpineStarted`
    // flag). Calling `Alpine.start()` again on every test would make
    // Alpine emit the "already been initialized" warning and leak state
    // between tests. Runs on REAL timers: happy-dom 20.3.3+ mocks the
    // microtask queue under `vi.useFakeTimers()` and Alpine's mutation
    // observer would never fire, leaving directives like `@click`
    // unprocessed. Each test flips to fake timers only after the markup
    // is mounted and reactive.
    const register = integrationPlugin();
    if (!register) {
      throw new Error("Expected toast plugin factory");
    }
    startAlpine(register);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("updates the dom when $toast pushes an item", async () => {
    document.body.innerHTML = `
      <div x-data>
        <button id="btn" @click="$toast('hi')">toast</button>
        <span id="count" x-text="$store.toast.items.length"></span>
        <div id="visible" x-show="$store.toast.items.length > 0">shown</div>
      </div>
    `;
    await Alpine.nextTick();

    document.getElementById("btn")?.click();
    await Promise.resolve();

    expect((Alpine.store("toast") as ToastStore).items).toHaveLength(1);
    expect(document.getElementById("count")?.textContent).toBe("1");
  });

  it("transitions promise toasts from loading to success in the dom", async () => {
    document.body.innerHTML = `
      <div x-data>
        <button
          id="btn"
          @click="() => $toast.promise(() => new Promise((resolve) => setTimeout(() => resolve('done'), 1200)), { loading: 'Saving...', success: 'Saved!' })"
        >
          promise
        </button>
        <span id="variant" x-text="$store.toast.items[0]?.variant"></span>
        <span id="title" x-text="$store.toast.items[0]?.title"></span>
      </div>
    `;
    await Alpine.nextTick();

    // Flip to fake timers only after Alpine's mutation observer has
    // processed the markup. Otherwise happy-dom 20.3.3+ swallows the
    // observer microtasks and `@click` never binds.
    vi.useFakeTimers();

    document.getElementById("btn")?.click();
    await Promise.resolve();

    expect(document.getElementById("variant")?.textContent).toBe("loading");
    expect(document.getElementById("title")?.textContent).toBe("Saving...");

    await vi.advanceTimersByTimeAsync(1200);
    await Promise.resolve();

    expect(document.getElementById("variant")?.textContent).toBe("success");
    expect(document.getElementById("title")?.textContent).toBe("Saved!");
  });
});
