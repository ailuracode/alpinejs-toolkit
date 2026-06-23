import type { QueryStore } from "@ailuracode/alpine-query";
import query from "@ailuracode/alpine-query";
import { createAlpineNanostoresAdapter } from "@ailuracode/alpine-query-adapter-nanostores";
import queryDevtoolsPlugin from "@ailuracode/alpine-query-devtools";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { getQueryStore, mountQueryDevtools } from "../src/panel.js";
import { DEFAULT_TOGGLE_CORNER_STORAGE_KEY } from "../src/toggle-corner.js";

const nanostoresQuery = () => query({ adapter: createAlpineNanostoresAdapter });

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

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;

    const controller = mountQueryDevtools({ store, initialOpen: true });
    const toggle = document.querySelector(".aq-devtools-toggle") as HTMLButtonElement;

    expect(toggle.textContent).toBe("Query (0)");
    expect(document.querySelector(".aq-devtools-title")?.textContent).toBe(
      "Alpine Query · Nanostores"
    );

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
    const Alpine = startAlpine(nanostoresQuery());
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

  it("supports panel interactions and filtering", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: true });

    await store
      .mutate<string, string>({
        mutationFn: async (title) => `created:${title}`,
      })
      .mutate("todo");

    const query = store.observe(["visible"], async () => "shown");
    const hidden = store.observe(["hidden"], async () => "secret");
    await vi.waitFor(() => {
      expect(query.isSuccess).toBe(true);
      expect(hidden.isSuccess).toBe(true);
    });

    const search = document.querySelector(".aq-devtools-search") as HTMLInputElement;
    search.value = "visible";
    search.dispatchEvent(new Event("input"));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const list = document.querySelector(".aq-devtools-list");
    expect(list?.textContent).toContain("visible");
    expect(list?.textContent).not.toContain("hidden");

    search.value = "";
    search.dispatchEvent(new Event("input"));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const mutationsTab = [...document.querySelectorAll(".aq-devtools-tab")].find(
      (button) => button.textContent === "Mutations"
    ) as HTMLButtonElement;
    mutationsTab.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.body.textContent).toContain("mutation-");

    controller.close();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.querySelector(".aq-devtools-panel")?.classList.contains("is-open")).toBe(false);

    controller.destroy();
    query.destroy();
    hidden.destroy();
  });

  it("registers through the alpine plugin on alpine:initialized", () => {
    const Alpine = startAlpine(nanostoresQuery(), queryDevtoolsPlugin());
    document.dispatchEvent(new Event("alpine:initialized"));

    expect(document.querySelector(".aq-devtools-toggle")).toBeTruthy();
    document.querySelector(".aq-devtools-root")?.remove();
    (Alpine.store("query") as QueryStore).reset();
  });

  it("getQueryStore() throws when query store is missing", () => {
    expect(() => getQueryStore({ store: () => undefined })).toThrow(
      "@ailuracode/alpine-query-devtools could not find"
    );
  });

  it("getQueryStore() accepts a createQueryClient() instance", async () => {
    vi.useFakeTimers();

    const { createQueryClient } = await import("@ailuracode/alpine-query");
    const store = getQueryStore(createQueryClient());

    const controller = mountQueryDevtools({ store, initialOpen: true });
    const query = store.observe(["standalone"], async () => "nanostores");
    await vi.runAllTimersAsync();

    expect(document.querySelector(".aq-devtools-toggle")?.textContent).toBe("Query (1)");
    expect(document.body.textContent).toContain("nanostores");

    store.invalidate(["standalone"]);
    await vi.runAllTimersAsync();
    expect(query.data).toBe("nanostores");

    store.remove(["standalone"]);
    expect(store.get(["standalone"])).toBeUndefined();

    controller.destroy();
    query.destroy();
    store.reset();
    vi.useRealTimers();
  });

  it("devtools actions refetch, invalidate, and remove queries", async () => {
    vi.useFakeTimers();

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce("v1")
      .mockResolvedValueOnce("v2")
      .mockResolvedValueOnce("v3");

    const query = store.observe(["actions"], queryFn, { staleTime: 60_000 });
    await vi.runAllTimersAsync();
    expect(query.data).toBe("v1");

    const controller = mountQueryDevtools({ store, initialOpen: true });

    const invalidateButton = [...document.querySelectorAll(".aq-devtools-btn")].find(
      (button) => button.textContent === "Invalidate"
    ) as HTMLButtonElement;
    invalidateButton.click();
    await vi.runAllTimersAsync();
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(query.data).toBe("v2");

    const refetchButton = [...document.querySelectorAll(".aq-devtools-btn")].find(
      (button) => button.textContent === "Refetch"
    ) as HTMLButtonElement;
    refetchButton.click();
    await vi.runAllTimersAsync();
    expect(queryFn).toHaveBeenCalledTimes(3);
    expect(query.data).toBe("v3");

    const removeButton = [...document.querySelectorAll(".aq-devtools-btn")].find(
      (button) => button.textContent === "Remove"
    ) as HTMLButtonElement;
    removeButton.click();
    expect(store.get(["actions"])).toBeUndefined();

    controller.destroy();
    query.destroy();
    vi.useRealTimers();
  });
});
