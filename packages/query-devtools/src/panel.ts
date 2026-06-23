import type {
  MutationDevtoolsEntry,
  QueryDevtoolsEntry,
  QueryDevtoolsSnapshot,
  QueryKey,
  QueryStore,
} from "@ailuracode/alpine-query";
import { DEVTOOLS_STYLES } from "./styles.js";
import {
  applyToggleCorner,
  cornerLabel,
  DEFAULT_TOGGLE_CORNER,
  DEFAULT_TOGGLE_CORNER_STORAGE_KEY,
  loadToggleCorner,
  saveToggleCorner,
  TOGGLE_CORNERS,
} from "./toggle-corner.js";
import type { QueryDevtoolsController, QueryDevtoolsMountOptions, ToggleCorner } from "./types.js";

function formatKey(key: QueryKey): string {
  return JSON.stringify(key);
}

function formatTime(timestamp: number): string {
  if (!timestamp) {
    return "—";
  }

  return new Date(timestamp).toLocaleTimeString();
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? "undefined";
  } catch {
    return String(value);
  }
}

function matchesFilter(text: string, filter: string): boolean {
  return text.toLowerCase().includes(filter.trim().toLowerCase());
}

function createBadge(label: string, modifier: string): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = `aq-devtools-badge aq-devtools-badge--${modifier}`;
  badge.textContent = label;
  return badge;
}

function appendQueryBadges(container: HTMLElement, entry: QueryDevtoolsEntry): void {
  container.append(
    createBadge(entry.status, entry.status === "success" ? "success" : entry.status),
    createBadge(entry.fetchStatus, entry.fetchStatus === "fetching" ? "fetching" : "muted")
  );

  if (entry.isStale) {
    container.append(createBadge("stale", "stale"));
  }

  if (entry.observers > 0) {
    container.append(createBadge(`${entry.observers} obs`, "muted"));
  }
}

function createEmptyState(message: string): HTMLDivElement {
  const empty = document.createElement("div");
  empty.className = "aq-devtools-empty";
  empty.textContent = message;
  return empty;
}

function createQueryListItem(
  entry: QueryDevtoolsEntry,
  isSelected: boolean,
  onSelect: (entry: QueryDevtoolsEntry) => void
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "aq-devtools-item";
  button.classList.toggle("is-selected", isSelected);

  const key = document.createElement("div");
  key.className = "aq-devtools-item-key";
  key.textContent = formatKey(entry.key);

  const badges = document.createElement("div");
  badges.className = "aq-devtools-badges";
  appendQueryBadges(badges, entry);

  button.append(key, badges);
  button.addEventListener("click", () => {
    onSelect(entry);
  });

  return button;
}

function createMutationListItem(
  entry: MutationDevtoolsEntry,
  isSelected: boolean,
  onSelect: (entry: MutationDevtoolsEntry) => void
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "aq-devtools-item";
  button.classList.toggle("is-selected", isSelected);

  const key = document.createElement("div");
  key.className = "aq-devtools-item-key";
  key.textContent = `${entry.id} · ${entry.status}`;

  const badges = document.createElement("div");
  badges.className = "aq-devtools-badges";
  badges.append(createBadge(entry.status, entry.status === "success" ? "success" : entry.status));

  button.append(key, badges);
  button.addEventListener("click", () => {
    onSelect(entry);
  });

  return button;
}

export function mountQueryDevtools(options: QueryDevtoolsMountOptions): QueryDevtoolsController {
  const {
    store,
    position = "bottom",
    initialOpen = false,
    toggleCorner = DEFAULT_TOGGLE_CORNER,
    persistToggleCorner = true,
    toggleCornerStorageKey = DEFAULT_TOGGLE_CORNER_STORAGE_KEY,
  } = options;
  let isOpen = initialOpen;
  let activeTab: "queries" | "mutations" = "queries";
  let selectedQueryHash: string | null = null;
  let selectedMutationId: string | null = null;
  let search = options.filter ?? "";
  let scheduled = false;
  let currentToggleCorner = persistToggleCorner
    ? loadToggleCorner(toggleCornerStorageKey, toggleCorner)
    : toggleCorner;

  if (!store.devtools) {
    throw new Error(
      "@ailuracode/alpine-query-devtools requires @ailuracode/alpine-query with devtools support"
    );
  }

  if (!document.getElementById("aq-devtools-styles")) {
    const style = document.createElement("style");
    style.id = "aq-devtools-styles";
    style.textContent = DEVTOOLS_STYLES;
    document.head.append(style);
  }

  const root = document.createElement("div");
  root.className = "aq-devtools-root";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "aq-devtools-toggle";
  toggle.setAttribute("aria-label", "Toggle Alpine Query Devtools");

  const panel = document.createElement("section");
  panel.className = `aq-devtools-panel aq-devtools-panel--${position}`;

  const header = document.createElement("header");
  header.className = "aq-devtools-header";

  const title = document.createElement("div");
  title.className = "aq-devtools-title";
  title.textContent = "Alpine Query";

  const searchInput = document.createElement("input");
  searchInput.className = "aq-devtools-search";
  searchInput.type = "search";
  searchInput.placeholder = "Filter by query key…";
  searchInput.value = search;

  const tabs = document.createElement("div");
  tabs.className = "aq-devtools-tabs";

  const queriesTab = document.createElement("button");
  queriesTab.type = "button";
  queriesTab.className = "aq-devtools-tab";
  queriesTab.textContent = "Queries";

  const mutationsTab = document.createElement("button");
  mutationsTab.type = "button";
  mutationsTab.className = "aq-devtools-tab";
  mutationsTab.textContent = "Mutations";

  const cornerSelect = document.createElement("select");
  cornerSelect.className = "aq-devtools-select";
  cornerSelect.setAttribute("aria-label", "Toggle button corner");

  for (const corner of TOGGLE_CORNERS) {
    const option = document.createElement("option");
    option.value = corner;
    option.textContent = cornerLabel(corner);
    cornerSelect.append(option);
  }

  cornerSelect.value = currentToggleCorner;

  const setToggleCorner = (corner: ToggleCorner): void => {
    currentToggleCorner = corner;
    applyToggleCorner(toggle, corner);
    cornerSelect.value = corner;

    if (persistToggleCorner) {
      saveToggleCorner(toggleCornerStorageKey, corner);
    }
  };

  cornerSelect.addEventListener("change", () => {
    setToggleCorner(cornerSelect.value as ToggleCorner);
  });

  setToggleCorner(currentToggleCorner);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "aq-devtools-btn";
  closeButton.textContent = "Close";

  const body = document.createElement("div");
  body.className = "aq-devtools-body";

  const list = document.createElement("div");
  list.className = "aq-devtools-list";

  const detail = document.createElement("div");
  detail.className = "aq-devtools-detail";

  tabs.append(queriesTab, mutationsTab);
  header.append(title, searchInput, cornerSelect, tabs, closeButton);
  body.append(list, detail);
  panel.append(header, body);
  root.append(toggle, panel);
  document.body.append(root);

  const renderQueryDetail = (entry: QueryDevtoolsEntry): void => {
    detail.replaceChildren();

    const actions = document.createElement("div");
    actions.className = "aq-devtools-section";
    actions.innerHTML = "<h3>Actions</h3>";

    const actionRow = document.createElement("div");
    actionRow.className = "aq-devtools-actions";

    const refetchButton = document.createElement("button");
    refetchButton.type = "button";
    refetchButton.className = "aq-devtools-btn";
    refetchButton.textContent = "Refetch";
    refetchButton.addEventListener("click", () => {
      void store.get(entry.key)?.refetch();
    });

    const invalidateButton = document.createElement("button");
    invalidateButton.type = "button";
    invalidateButton.className = "aq-devtools-btn";
    invalidateButton.textContent = "Invalidate";
    invalidateButton.addEventListener("click", () => {
      store.invalidate(entry.key);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "aq-devtools-btn";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      store.remove(entry.key);
      selectedQueryHash = null;
      scheduleRender();
    });

    actionRow.append(refetchButton, invalidateButton, removeButton);
    actions.append(actionRow);

    const stateSection = document.createElement("div");
    stateSection.className = "aq-devtools-section";
    stateSection.innerHTML = "<h3>State</h3>";
    const statePre = document.createElement("pre");
    statePre.className = "aq-devtools-pre";
    statePre.textContent = formatJson({
      status: entry.status,
      fetchStatus: entry.fetchStatus,
      isLoading: entry.isLoading,
      isFetching: entry.isFetching,
      isSuccess: entry.isSuccess,
      isError: entry.isError,
      isStale: entry.isStale,
      observers: entry.observers,
      isInvalidated: entry.isInvalidated,
      dataUpdatedAt: formatTime(entry.dataUpdatedAt),
      errorUpdatedAt: formatTime(entry.errorUpdatedAt),
      error: entry.error,
    });
    stateSection.append(statePre);

    const optionsSection = document.createElement("div");
    optionsSection.className = "aq-devtools-section";
    optionsSection.innerHTML = "<h3>Options</h3>";
    const optionsPre = document.createElement("pre");
    optionsPre.className = "aq-devtools-pre";
    optionsPre.textContent = formatJson(entry.options);
    optionsSection.append(optionsPre);

    const dataSection = document.createElement("div");
    dataSection.className = "aq-devtools-section";
    dataSection.innerHTML = "<h3>Data</h3>";
    const dataPre = document.createElement("pre");
    dataPre.className = "aq-devtools-pre";
    dataPre.textContent = formatJson(entry.data);
    dataSection.append(dataPre);

    detail.append(actions, stateSection, optionsSection, dataSection);
  };

  const renderMutationDetail = (entry: MutationDevtoolsEntry): void => {
    detail.replaceChildren();

    const stateSection = document.createElement("div");
    stateSection.className = "aq-devtools-section";
    stateSection.innerHTML = "<h3>Mutation</h3>";
    const statePre = document.createElement("pre");
    statePre.className = "aq-devtools-pre";
    statePre.textContent = formatJson({
      id: entry.id,
      status: entry.status,
      updatedAt: formatTime(entry.updatedAt),
      variables: entry.variables,
      data: entry.data,
      error: entry.error,
    });
    stateSection.append(statePre);
    detail.append(stateSection);
  };

  const renderQueries = (snapshot: QueryDevtoolsSnapshot): void => {
    const queries = snapshot.queries.filter((entry) => matchesFilter(formatKey(entry.key), search));

    if (queries.length === 0) {
      list.append(
        createEmptyState(search ? "No queries match your filter." : "No queries cached yet.")
      );
      return;
    }

    for (const entry of queries) {
      list.append(
        createQueryListItem(entry, selectedQueryHash === entry.keyHash, (next) => {
          selectedQueryHash = next.keyHash;
          renderQueryDetail(next);
          scheduleRender();
        })
      );
    }

    const selected = queries.find((entry) => entry.keyHash === selectedQueryHash) ?? queries[0];
    if (selected) {
      selectedQueryHash = selected.keyHash;
      renderQueryDetail(selected);
    }
  };

  const renderMutations = (snapshot: QueryDevtoolsSnapshot): void => {
    const mutations = snapshot.mutations.filter((entry) =>
      matchesFilter(`${entry.id} ${formatJson(entry.variables)}`, search)
    );

    if (mutations.length === 0) {
      list.append(
        createEmptyState(search ? "No mutations match your filter." : "No mutations yet.")
      );
      return;
    }

    for (const entry of mutations) {
      list.append(
        createMutationListItem(entry, selectedMutationId === entry.id, (next) => {
          selectedMutationId = next.id;
          renderMutationDetail(next);
          scheduleRender();
        })
      );
    }

    const selected = mutations.find((entry) => entry.id === selectedMutationId) ?? mutations[0];
    if (selected) {
      selectedMutationId = selected.id;
      renderMutationDetail(selected);
    }
  };

  const render = (): void => {
    scheduled = false;
    const snapshot = store.devtools.getSnapshot();

    toggle.textContent = `Query (${snapshot.queries.length})`;
    panel.classList.toggle("is-open", isOpen);
    queriesTab.classList.toggle("is-active", activeTab === "queries");
    mutationsTab.classList.toggle("is-active", activeTab === "mutations");

    list.replaceChildren();
    detail.replaceChildren();

    if (activeTab === "queries") {
      renderQueries(snapshot);
      return;
    }

    renderMutations(snapshot);
  };

  const scheduleRender = (): void => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(render);
  };

  render();
  const unsubscribe = store.devtools.subscribe(scheduleRender);

  searchInput.addEventListener("input", () => {
    search = searchInput.value;
    scheduleRender();
  });

  toggle.addEventListener("click", () => {
    isOpen = !isOpen;
    scheduleRender();
  });

  closeButton.addEventListener("click", () => {
    isOpen = false;
    scheduleRender();
  });

  queriesTab.addEventListener("click", () => {
    activeTab = "queries";
    scheduleRender();
  });

  mutationsTab.addEventListener("click", () => {
    activeTab = "mutations";
    scheduleRender();
  });

  return {
    open() {
      isOpen = true;
      scheduleRender();
    },
    close() {
      isOpen = false;
      scheduleRender();
    },
    toggle() {
      isOpen = !isOpen;
      scheduleRender();
    },
    setToggleCorner(corner: ToggleCorner) {
      setToggleCorner(corner);
    },
    getToggleCorner() {
      return currentToggleCorner;
    },
    destroy() {
      unsubscribe();
      root.remove();
    },
  };
}

export function getQueryStore(
  Alpine: { store(name: string): unknown },
  storeName = "query"
): QueryStore {
  const store = Alpine.store(storeName) as QueryStore | undefined;

  if (!store?.devtools) {
    throw new Error(
      `@ailuracode/alpine-query-devtools could not find $store.${storeName}. Register @ailuracode/alpine-query first.`
    );
  }

  return store;
}

export type { QueryDevtoolsSnapshot };
