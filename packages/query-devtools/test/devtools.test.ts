import queryPlugin, { type QueryStore } from "@ailuracode/alpine-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { mountQueryDevtools } from "../src/panel.js";
import { DEFAULT_TOGGLE_CORNER_STORAGE_KEY } from "../src/toggle-corner.js";

describe("@ailuracode/alpine-query-devtools", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.querySelector(".aq-devtools-root")?.remove();
    document.getElementById("aq-devtools-styles")?.remove();
  });

  it("mounts a panel and reflects query cache updates", async () => {
    vi.useFakeTimers();

    const Alpine = startAlpine(queryPlugin());
    const store = Alpine.store("query") as QueryStore;

    const controller = mountQueryDevtools({ store, initialOpen: true });
    const toggle = document.querySelector(".aq-devtools-toggle") as HTMLButtonElement;

    expect(toggle.textContent).toBe("Query (0)");

    const query = store.observe(["pokemon", 1], async () => ({ name: "bulbasaur" }));
    await vi.runAllTimersAsync();

    expect(toggle.textContent).toBe("Query (1)");
    expect(document.querySelector(".aq-devtools-panel")?.classList.contains("is-open")).toBe(true);
    expect(document.body.textContent).toContain('["pokemon",1]');
    expect(document.body.textContent).toContain("bulbasaur");

    controller.destroy();
    query.destroy();
    vi.useRealTimers();
  });

  it("positions the toggle in a selected corner and persists it", () => {
    const Alpine = startAlpine(queryPlugin());
    const store = Alpine.store("query") as QueryStore;

    const controller = mountQueryDevtools({
      store,
      toggleCorner: "top-left",
      persistToggleCorner: true,
    });

    const toggle = document.querySelector(".aq-devtools-toggle") as HTMLButtonElement;
    expect(toggle.classList.contains("aq-devtools-toggle--top-left")).toBe(true);

    controller.setToggleCorner("bottom-left");
    expect(toggle.classList.contains("aq-devtools-toggle--bottom-left")).toBe(true);
    expect(localStorage.getItem(DEFAULT_TOGGLE_CORNER_STORAGE_KEY)).toBe("bottom-left");

    controller.destroy();

    const restoredController = mountQueryDevtools({ store, persistToggleCorner: true });
    const restored = document.querySelector(".aq-devtools-toggle") as HTMLButtonElement;
    expect(restored.classList.contains("aq-devtools-toggle--bottom-left")).toBe(true);
    restoredController.destroy();
  });
});
