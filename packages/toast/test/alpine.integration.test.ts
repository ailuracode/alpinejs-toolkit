import Alpine from "alpinejs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    vi.useFakeTimers();
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

    const register = integrationPlugin();
    if (!register) {
      throw new Error("Expected toast plugin factory");
    }

    Alpine.plugin(register);
    Alpine.start();

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

    const register = integrationPlugin();
    if (!register) {
      throw new Error("Expected toast plugin factory");
    }

    Alpine.plugin(register);
    Alpine.start();

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
