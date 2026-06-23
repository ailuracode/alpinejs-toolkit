import type { QueryStore } from "@ailuracode/alpine-query";
import query, { createQueryClient } from "@ailuracode/alpine-query";
import { createAlpineStoreAdapter } from "@ailuracode/alpine-query-adapter-alpine";
import { createAlpineNanostoresAdapter } from "@ailuracode/alpine-query-adapter-nanostores";
import queryDevtoolsPlugin from "@ailuracode/alpine-query-devtools";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startAlpine } from "../../../test/helpers.js";
import { resetMatchMedia, setMatchMedia } from "../../../test/setup.js";
import { adapterBadgeHue, adapterBadgeStyle } from "../src/adapter-badge.js";
import { getQueryStore, mountQueryDevtools } from "../src/panel.js";
import { DEFAULT_PREFERENCES_STORAGE_KEY } from "../src/panel-preferences.js";
import { applyResponsiveLayout } from "../src/responsive-layout.js";
import { DEFAULT_TOGGLE_CORNER_STORAGE_KEY } from "../src/toggle-corner.js";

const nanostoresQuery = () => query({ adapter: createAlpineNanostoresAdapter });

describe("@ailuracode/alpine-query-devtools", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  afterEach(() => {
    document.querySelector(".aq-devtools-root")?.remove();
    vi.restoreAllMocks();
    resetMatchMedia();
  });

  it("persists panel selectors across remounts", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;

    const controller = mountQueryDevtools({ store, initialOpen: true, persistPreferences: true });
    const search = document.querySelector(".aq-devtools-search") as HTMLInputElement;
    const sortSelect = document.querySelector(".aq-devtools-select--sort") as HTMLSelectElement;

    search.value = "pokemon";
    search.dispatchEvent(new Event("input"));

    sortSelect.value = "key-asc";
    sortSelect.dispatchEvent(new Event("change"));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const followLatest = document.querySelector(
      ".aq-devtools-follow-latest input"
    ) as HTMLInputElement;
    followLatest.checked = true;
    followLatest.dispatchEvent(new Event("change"));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    controller.destroy();

    mountQueryDevtools({ store, initialOpen: true, persistPreferences: true });
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect((document.querySelector(".aq-devtools-search") as HTMLInputElement).value).toBe(
      "pokemon"
    );
    expect((document.querySelector(".aq-devtools-select--sort") as HTMLSelectElement).value).toBe(
      "key-asc"
    );
    expect(
      (document.querySelector(".aq-devtools-follow-latest input") as HTMLInputElement).checked
    ).toBe(true);
    expect(JSON.parse(localStorage.getItem(DEFAULT_PREFERENCES_STORAGE_KEY) ?? "{}").search).toBe(
      "pokemon"
    );

    document.querySelector(".aq-devtools-root")?.remove();
  });

  it("persists panel open state across remounts when remember open is enabled", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;

    const controller = mountQueryDevtools({
      store,
      initialOpen: false,
      rememberOpenState: true,
      persistPreferences: true,
    });

    controller.open();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.querySelector(".aq-devtools-panel")?.classList.contains("is-open")).toBe(true);

    controller.destroy();

    mountQueryDevtools({ store, initialOpen: false, persistPreferences: true });
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(document.querySelector(".aq-devtools-panel")?.classList.contains("is-open")).toBe(true);
    expect(JSON.parse(localStorage.getItem(DEFAULT_PREFERENCES_STORAGE_KEY) ?? "{}").isOpen).toBe(
      true
    );
    expect(
      JSON.parse(localStorage.getItem(DEFAULT_PREFERENCES_STORAGE_KEY) ?? "{}").rememberOpenState
    ).toBe(true);

    document.querySelector(".aq-devtools-root")?.remove();
  });

  it("does not restore panel open state without remember open enabled", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;

    const controller = mountQueryDevtools({
      store,
      initialOpen: false,
      persistPreferences: true,
    });

    const rememberOpen = document.querySelector(
      ".aq-devtools-remember-open input"
    ) as HTMLInputElement;
    expect(rememberOpen.checked).toBe(false);

    controller.open();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const search = document.querySelector(".aq-devtools-search") as HTMLInputElement;
    search.value = "seed";
    search.dispatchEvent(new Event("input"));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    controller.destroy();

    mountQueryDevtools({ store, initialOpen: false, persistPreferences: true });
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(document.querySelector(".aq-devtools-panel")?.classList.contains("is-open")).toBe(false);

    document.querySelector(".aq-devtools-root")?.remove();
  });

  it("starts on the query list in compact layout without follow latest", async () => {
    setMatchMedia("(max-width: 640px)", true);

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({
      store,
      initialOpen: true,
      position: "bottom",
      persistPreferences: false,
    });

    store.observe(["pokemon", 1], async () => ({ name: "bulbasaur" }));
    await vi.waitFor(() => {
      expect(document.querySelectorAll(".aq-devtools-item").length).toBeGreaterThan(0);
    });
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const list = document.querySelector(".aq-devtools-list") as HTMLElement;
    const detail = document.querySelector(".aq-devtools-detail") as HTMLElement;
    expect(list.style.display).not.toBe("none");
    expect(detail.style.display).toBe("none");

    controller.destroy();
    setMatchMedia("(max-width: 640px)", false);
  });

  it("follow latest keeps the newest query selected", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({
      store,
      initialOpen: true,
      followLatest: true,
      persistPreferences: false,
    });

    let resolveFirst!: (value: string) => void;
    const firstPending = new Promise<string>((done) => {
      resolveFirst = done;
    });

    store.observe(["first"], async () => firstPending);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(document.querySelector(".aq-devtools-item.is-selected")?.textContent).toContain("first");

    let resolveSecond!: (value: string) => void;
    const secondPending = new Promise<string>((done) => {
      resolveSecond = done;
    });

    store.observe(["second"], async () => secondPending);
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(document.querySelector(".aq-devtools-item.is-selected")?.textContent).toContain(
      "second"
    );

    resolveFirst("done-1");
    resolveSecond("done-2");
    await vi.waitFor(() => {
      expect(document.querySelector(".aq-devtools-item.is-selected")?.textContent).toContain(
        "second"
      );
    });

    controller.destroy();
  });

  it("mounts a panel and reflects query cache updates", async () => {
    vi.useFakeTimers();

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;

    const controller = mountQueryDevtools({ store, initialOpen: true });
    const toggle = document.querySelector(".aq-devtools-toggle") as HTMLButtonElement;

    expect(toggle.textContent).toBe("Query (0)");
    expect(document.querySelector(".aq-devtools-title")?.textContent).toBe("Alpine Query");
    expect(document.querySelector(".aq-devtools-subtitle")?.textContent).toBe("Nanostores");
    const root = document.querySelector(".aq-devtools-root") as HTMLElement | null;
    expect(root?.style.getPropertyValue("--aq-brand")).not.toBe("");
    expect(root?.querySelector("style")).toBeNull();

    const query = store.observe(["pokemon", 1], async () => ({ name: "bulbasaur" }));
    await vi.runAllTimersAsync();

    expect(toggle.textContent).toBe("Query (1)");
    expect(toggle.hidden).toBe(true);
    expect(document.querySelector(".aq-devtools-panel")?.classList.contains("is-open")).toBe(true);
    expect(document.body.textContent).toContain("pokemon › 1");
    expect(document.body.textContent).toContain("bulbasaur");

    controller.destroy();
    query.destroy();
    vi.useRealTimers();
  });

  it("allows scrolling in the query list pane", () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: true });

    const list = document.querySelector(".aq-devtools-list") as HTMLElement;
    expect(list.style.overflow).toBe("auto");
    expect(list.style.minHeight).toBe("0");

    controller.destroy();
  });

  it("updates badges when a cached query refetches", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: true });

    let resolveFirst!: (value: string) => void;
    let resolveSecond!: (value: string) => void;
    const firstPending = new Promise<string>((done) => {
      resolveFirst = done;
    });
    const secondPending = new Promise<string>((done) => {
      resolveSecond = done;
    });
    const queryFn = vi
      .fn()
      .mockImplementationOnce(async () => firstPending)
      .mockImplementationOnce(async () => secondPending);

    store.observe(["refetch-me"], queryFn, { staleTime: 60_000 });
    await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame));

    const list = document.querySelector(".aq-devtools-list");
    expect(list?.textContent).toContain("fetching");

    resolveFirst("v1");
    await vi.waitFor(() => {
      expect(list?.textContent).toContain("success");
      expect(list?.textContent).not.toContain("fetching");
    });

    store.invalidate(["refetch-me"]);
    await vi.waitFor(() => {
      expect(list?.textContent).toContain("fetching");
    });

    resolveSecond("v2");
    await vi.waitFor(() => {
      expect(list?.textContent).toContain("success");
      expect(list?.textContent).not.toContain("fetching");
    });

    controller.destroy();
  });

  it("renders error state in the panel", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: true });

    store.observe(
      ["broken"],
      () => {
        throw new Error("boom");
      },
      { retry: 0 }
    );

    await vi.waitFor(() => {
      const list = document.querySelector(".aq-devtools-list");
      expect(list?.textContent).toContain("error");
    });

    controller.destroy();
  });

  it("lists in-flight queries at the top with follow latest", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({
      store,
      initialOpen: true,
      followLatest: true,
      persistPreferences: false,
    });

    store.observe(["cached"], async () => ({ name: "bulbasaur" }));
    await vi.waitFor(() => {
      expect(document.querySelector(".aq-devtools-list")?.textContent).toContain("success");
    });

    let resolve!: (value: { name: string }) => void;
    const pending = new Promise<{ name: string }>((done) => {
      resolve = done;
    });

    store.observe(["in-flight"], async () => pending);
    await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame));

    const items = [...document.querySelectorAll(".aq-devtools-item-key")];
    expect(items[0]?.textContent).toContain("in-flight");
    expect(document.querySelector(".aq-devtools-item.is-selected")?.textContent).toContain(
      "pending"
    );

    resolve({ name: "ivysaur" });
    await vi.waitFor(() => {
      expect(document.querySelector(".aq-devtools-item.is-selected")?.textContent).toContain(
        "success"
      );
    });

    controller.destroy();
  });

  it("renders pending and fetching badges while a query is in flight", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: true });

    let resolve!: (value: string) => void;
    const pending = new Promise<string>((done) => {
      resolve = done;
    });

    store.observe(["in-flight"], async () => pending);
    await new Promise((resolveFrame) => requestAnimationFrame(resolveFrame));

    const list = document.querySelector(".aq-devtools-list");
    expect(list?.textContent).toContain("pending");
    expect(list?.textContent).toContain("fetching");

    resolve("done");
    await vi.waitFor(() => {
      expect(list?.textContent).toContain("success");
      expect(document.body.textContent).toMatch(/\d+ms/);
    });

    controller.destroy();
  });

  it("renders options and data with the same json section layout", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: true });

    store.observe(["pokemon", 1], async () => ({ name: "bulbasaur" }), {
      staleTime: 300_000,
    });

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain("Options");
    });

    const sections = [...document.querySelectorAll(".aq-devtools-section")].filter((section) =>
      ["Options", "Data"].includes(section.querySelector("h3")?.textContent ?? "")
    );

    expect(sections).toHaveLength(2);

    for (const section of sections) {
      const tabs = section.querySelectorAll(".aq-devtools-tab");
      expect(tabs[0]?.textContent).toBe("Tree");
      expect(section.querySelector(".aq-devtools-data-modes")).toBeTruthy();
      expect(section.querySelector(".aq-devtools-tree")).toBeTruthy();
    }

    expect(sections[0]?.querySelectorAll(".aq-devtools-tab")[1]?.textContent).toBe("JSON");
    expect(sections[1]?.querySelectorAll(".aq-devtools-tab")[1]?.textContent).toBe("Edit");

    controller.destroy();
  });

  it("styles action buttons with visible button affordances", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: true });

    store.observe(["pokemon", 1], async () => ({ name: "bulbasaur" }));

    await vi.waitFor(() => {
      expect(
        [...document.querySelectorAll(".aq-devtools-btn")].some(
          (button) => button.textContent === "Invalidate"
        )
      ).toBe(true);
    });

    const invalidateButton = [...document.querySelectorAll(".aq-devtools-btn")].find(
      (button) => button.textContent === "Invalidate"
    ) as HTMLButtonElement;

    expect(invalidateButton.style.cssText).toContain("display: inline-flex");
    expect(invalidateButton.style.cssText).toContain("border: 1px");
    expect(invalidateButton.style.cssText).toContain("0.75rem");
    expect(invalidateButton.className).toContain("aq-devtools-btn");

    const resetCacheButton = [...document.querySelectorAll(".aq-devtools-btn")].find(
      (button) => button.textContent === "Reset cache"
    ) as HTMLButtonElement;

    expect(resetCacheButton.style.cssText).toContain("border: 1px");

    controller.destroy();
  });

  it("shows the panel on desktop after toggling open", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: false, position: "bottom" });

    const panel = document.querySelector(".aq-devtools-panel") as HTMLElement;
    expect(panel.style.display).toBe("none");

    controller.open();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(panel.classList.contains("is-open")).toBe(true);
    expect(panel.style.display).toBe("flex");
    expect(panel.style.width).toBe("auto");
    expect(panel.style.left).toBe("0.75rem");
    expect(panel.style.right).toBe("0.75rem");

    controller.destroy();
  });

  it("navigates to query detail on mobile and returns with back", async () => {
    setMatchMedia("(max-width: 640px)", true);

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: true, position: "bottom" });

    store.observe(["pokemon", 1], async () => ({ name: "bulbasaur" }));
    store.observe(["pokemon", 2], async () => ({ name: "ivysaur" }));

    await vi.waitFor(() => {
      expect(document.querySelectorAll(".aq-devtools-item").length).toBe(2);
    });

    const panel = document.querySelector(".aq-devtools-panel") as HTMLElement;
    const headerToolbar = panel.querySelector(".aq-devtools-header-toolbar") as HTMLElement;
    const toolbarTop = headerToolbar.children[0] as HTMLElement;
    const toolbarBottom = headerToolbar.children[1] as HTMLElement;
    const body = panel.querySelector(".aq-devtools-body") as HTMLElement;
    const list = panel.querySelector(".aq-devtools-list") as HTMLElement;
    const detail = panel.querySelector(".aq-devtools-detail") as HTMLElement;
    const searchInput = panel.querySelector(".aq-devtools-search") as HTMLInputElement;
    const adapterSelect = panel.querySelector(".aq-devtools-select--adapter") as HTMLSelectElement;
    const sortSelect = panel.querySelector(".aq-devtools-select--sort") as HTMLSelectElement;
    const tabs = panel.querySelector(".aq-devtools-tabs") as HTMLElement;
    const tabButtons = [...tabs.querySelectorAll(".aq-devtools-tab")] as HTMLButtonElement[];
    const queriesTab = tabButtons.find((button) => button.textContent === "Queries");
    const mutationsTab = tabButtons.find((button) => button.textContent === "Mutations");
    if (!(queriesTab && mutationsTab)) {
      throw new Error("Missing devtools tabs");
    }
    const resizeHandle = panel.querySelector(".aq-devtools-resize-handle") as HTMLElement;

    applyResponsiveLayout(
      {
        panel,
        resizeHandle,
        headerToolbar,
        toolbarTop,
        toolbarBottom,
        body,
        list,
        searchInput,
        adapterSelect,
        sortSelect,
        tabs,
        queriesTab,
        mutationsTab,
        position: "bottom",
      },
      true
    );

    searchInput.dispatchEvent(new Event("input"));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(list.style.display).not.toBe("none");
    expect(detail.style.display).toBe("none");
    const mobileBackButton = document.querySelector(".aq-devtools-back") as HTMLButtonElement;
    expect(mobileBackButton.hidden).toBe(true);

    const items = [...document.querySelectorAll(".aq-devtools-item")] as HTMLButtonElement[];
    items[0]?.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(list.style.display).toBe("none");
    expect(detail.style.display).not.toBe("none");
    expect(mobileBackButton.hidden).toBe(false);
    expect(mobileBackButton.textContent).toBe("← Back");
    expect(document.body.textContent).toContain("Refetch");

    mobileBackButton.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(list.style.display).not.toBe("none");
    expect(detail.style.display).toBe("none");
    expect(mobileBackButton.hidden).toBe(true);

    controller.destroy();
    setMatchMedia("(max-width: 640px)", false);
  });

  it("hides the mobile back bar while follow latest is enabled", async () => {
    setMatchMedia("(max-width: 640px)", true);

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({
      store,
      initialOpen: true,
      position: "bottom",
      followLatest: true,
      persistPreferences: false,
    });

    store.observe(["first"], async () => ({ name: "bulbasaur" }));
    await vi.waitFor(() => {
      expect(document.querySelector(".aq-devtools-detail")?.textContent).toContain("Refetch");
    });

    const mobileBackButton = document.querySelector(".aq-devtools-back") as HTMLButtonElement;
    expect(mobileBackButton.hidden).toBe(true);

    store.observe(["second"], async () => ({ name: "ivysaur" }));
    await vi.waitFor(() => {
      expect(document.body.textContent).toContain("ivysaur");
    });
    expect(mobileBackButton.hidden).toBe(true);

    controller.destroy();
    setMatchMedia("(max-width: 640px)", false);
  });

  it("hides the toggle while the panel is open", async () => {
    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, initialOpen: false });

    const toggle = document.querySelector(".aq-devtools-toggle") as HTMLButtonElement;
    expect(toggle.hidden).toBe(false);

    controller.open();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(toggle.hidden).toBe(true);

    controller.close();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(toggle.hidden).toBe(false);

    controller.destroy();
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

  it("merges additional headless query clients into one panel", async () => {
    vi.useFakeTimers();

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const headless = createQueryClient({ adapter: createAlpineStoreAdapter(Alpine) });

    const controller = mountQueryDevtools({
      store,
      additionalStores: [headless],
      initialOpen: true,
    });

    store.observe(["pokemon", 1], async () => ({ name: "bulbasaur" }));
    headless.observe(["pokemon", "alpine", 1], async () => ({ name: "charmander" }));
    await vi.runAllTimersAsync();

    expect(document.querySelector(".aq-devtools-toggle")?.textContent).toBe("Query (2)");
    expect(document.querySelector(".aq-devtools-title")?.textContent).toBe("Alpine Query");
    expect(document.querySelector(".aq-devtools-subtitle")?.textContent).toBe("");

    const adapterSelect = document.querySelector(
      ".aq-devtools-select--adapter"
    ) as HTMLSelectElement;
    expect(adapterSelect.hidden).toBe(false);
    expect([...adapterSelect.options].map((option) => option.textContent)).toEqual([
      "All adapters",
      "Nanostores",
      "Alpine.reactive",
    ]);
    expect(document.body.textContent).toContain("pokemon › 1");
    expect(document.body.textContent).toContain("Nanostores");
    expect(document.body.textContent).toContain("Alpine.reactive");

    const adapterBadges = [
      ...document.querySelectorAll(".aq-devtools-list .aq-devtools-badge--adapter"),
    ] as HTMLElement[];
    expect(adapterBadges).toHaveLength(2);
    expect(adapterBadges.map((badge) => badge.textContent).sort()).toEqual([
      "Alpine.reactive",
      "Nanostores",
    ]);

    const nanostoresBadge = adapterBadges.find((badge) => badge.textContent === "Nanostores");
    const alpineBadge = adapterBadges.find((badge) => badge.textContent === "Alpine.reactive");
    expect(nanostoresBadge?.style.background).toContain(`hsl(${adapterBadgeHue("Nanostores")}`);
    expect(alpineBadge?.style.background).toContain(`hsl(${adapterBadgeHue("Alpine.reactive")}`);
    expect(nanostoresBadge?.style.background).toBe(
      adapterBadgeStyle("Nanostores", "light").background
    );

    const nanostoresItem = [...document.querySelectorAll(".aq-devtools-item")].find((item) =>
      item.textContent?.includes("Nanostores")
    );
    nanostoresItem?.closest("button")?.click();
    await vi.runAllTimersAsync();
    expect(document.body.textContent).toContain("bulbasaur");

    controller.destroy();
    store.reset();
    headless.reset();
    vi.useRealTimers();
  });

  it("filters queries by adapter when multiple stores are mounted", async () => {
    vi.useFakeTimers();

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const headless = createQueryClient({ adapter: createAlpineStoreAdapter(Alpine) });

    mountQueryDevtools({
      store,
      additionalStores: [headless],
      initialOpen: true,
    });

    store.observe(["pokemon", 1], async () => ({ name: "bulbasaur" }));
    headless.observe(["pokemon", "alpine", 1], async () => ({ name: "charmander" }));
    await vi.runAllTimersAsync();
    vi.useRealTimers();

    const adapterSelect = document.querySelector(
      ".aq-devtools-select--adapter"
    ) as HTMLSelectElement;
    const nanostoresOption = [...adapterSelect.options].find(
      (option) => option.textContent === "Nanostores"
    );

    expect(nanostoresOption).toBeTruthy();
    adapterSelect.value = nanostoresOption?.value ?? "";
    adapterSelect.dispatchEvent(new Event("change"));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const list = document.querySelector(".aq-devtools-list");
    expect(list?.textContent).toContain("pokemon › 1");
    expect(list?.textContent).not.toContain("alpine › 1");

    adapterSelect.value = "all";
    adapterSelect.dispatchEvent(new Event("change"));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(list?.textContent).toContain("pokemon › 1");

    document.querySelector(".aq-devtools-root")?.remove();
    store.reset();
    headless.reset();
  });

  it("applies dark theme from the host document in system mode", () => {
    document.documentElement.dataset.theme = "dark";

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, theme: "system" });

    const root = document.querySelector(".aq-devtools-root") as HTMLElement;
    expect(root.classList.contains("aq-devtools-root--dark")).toBe(true);

    controller.destroy();
  });

  it("respects a forced light theme option", () => {
    document.documentElement.dataset.theme = "dark";

    const Alpine = startAlpine(nanostoresQuery());
    const store = Alpine.store("query") as QueryStore;
    const controller = mountQueryDevtools({ store, theme: "light" });

    const root = document.querySelector(".aq-devtools-root") as HTMLElement;
    expect(root.classList.contains("aq-devtools-root--light")).toBe(true);
    expect(root.classList.contains("aq-devtools-root--dark")).toBe(false);

    controller.destroy();
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
    await vi.waitFor(() => {
      expect(query.data).toBe("v1");
    });

    const controller = mountQueryDevtools({ store, initialOpen: true });

    const invalidateButton = [...document.querySelectorAll(".aq-devtools-btn")].find(
      (button) => button.textContent === "Invalidate"
    ) as HTMLButtonElement;
    invalidateButton.click();
    await vi.waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(2);
      expect(query.data).toBe("v2");
    });

    const resetButton = [...document.querySelectorAll(".aq-devtools-btn")].find(
      (button) => button.textContent === "Reset"
    ) as HTMLButtonElement;
    resetButton.click();
    expect(query.data).toBeUndefined();
    expect(query.status).toBe("pending");

    const refetchButton = [...document.querySelectorAll(".aq-devtools-btn")].find(
      (button) => button.textContent === "Refetch"
    ) as HTMLButtonElement;
    refetchButton.click();
    await vi.waitFor(() => {
      expect(queryFn).toHaveBeenCalledTimes(3);
      expect(query.data).toBe("v3");
    });

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
