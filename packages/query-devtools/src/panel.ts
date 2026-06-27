import type { QueryStore } from "@ailuracode/alpinejs-query";
import { type AdapterBadgeTheme, createAdapterBadge } from "./adapter-badge.js";
import { formatDuration } from "./format-duration.js";
import { formatKeyJson, formatQueryKeyLabel } from "./format-key.js";
import { createJsonTree } from "./json-tree.js";
import type {
  MutationDevtoolsEntryView,
  QueryDevtoolsEntryView,
  QueryDevtoolsSnapshotView,
} from "./merge-stores.js";
import { createMergedQueryDevtools, resolveQueryDevtoolsStores } from "./merge-stores.js";
import {
  ALL_ADAPTERS_VALUE,
  createPanelPreferences,
  DEFAULT_PREFERENCES_STORAGE_KEY,
  loadPanelPreferences,
  savePanelPreferences,
} from "./panel-preferences.js";
import {
  applyMobilePanelHeight,
  bindMobilePanelResize,
  resolveMobilePanelHeight,
} from "./panel-resize.js";
import {
  applyResponsiveLayout,
  bindPanelResponsiveLayout,
  isCompactLayout,
  statGridColumnTemplate,
} from "./responsive-layout.js";
import {
  MUTATION_SORT_OPTIONS,
  type MutationSortOption,
  mutationSortLabel,
  pickLatestMutation,
  pickLatestQuery,
  QUERY_SORT_OPTIONS,
  type QuerySortOption,
  querySortLabel,
  sortMutations,
  sortQueries,
} from "./sort.js";
import { applyStyle } from "./style-utils.js";
import { applyDevtoolsThemeClass, bindDevtoolsTheme } from "./theme.js";
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
import { paintClasses, paintSelect } from "./ui-styles.js";

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
  paintClasses(badge, "aq-devtools-badge", `aq-devtools-badge--${modifier}`);
  badge.textContent = label;
  return badge;
}

function appendQueryBadges(container: HTMLElement, entry: QueryDevtoolsEntryView): void {
  container.append(
    createBadge(entry.status, entry.status === "success" ? "success" : entry.status),
    createBadge(
      entry.fetchStatus,
      entry.fetchStatus === "fetching"
        ? "fetching"
        : entry.fetchStatus === "paused"
          ? "pending"
          : "muted"
    )
  );

  if (entry.isSuccess && !entry.isStale) {
    container.append(createBadge("fresh", "fresh"));
  }

  if (entry.isStale) {
    container.append(createBadge("stale", "stale"));
  }

  if (entry.fetchDurationMs !== null) {
    container.append(
      createBadge(formatDuration(entry.fetchDurationMs), entry.isFetching ? "fetching" : "muted")
    );
  }

  if (entry.observers === 0) {
    container.append(createBadge("inactive", "muted"));
  } else {
    container.append(createBadge(`${entry.observers} obs`, "muted"));
  }
}

function createEmptyState(message: string): HTMLDivElement {
  const empty = document.createElement("div");
  paintClasses(empty, "aq-devtools-empty");
  empty.textContent = message;
  return empty;
}

function createListHeader(label: string, count: number): HTMLDivElement {
  const header = document.createElement("div");
  paintClasses(header, "aq-devtools-list-header");
  header.append(document.createTextNode(label));

  const badge = document.createElement("span");
  paintClasses(badge, "aq-devtools-list-count");
  badge.textContent = String(count);
  header.append(badge);

  return header;
}

function createStatGrid(
  items: Array<{ label: string; value: string; tone?: "success" | "error" | "warning" | "muted" }>
): HTMLDivElement {
  const grid = document.createElement("div");
  paintClasses(grid, "aq-devtools-grid");
  applyStyle(grid, {
    gridTemplateColumns: statGridColumnTemplate(isCompactLayout()),
  });

  for (const item of items) {
    const stat = document.createElement("div");
    paintClasses(stat, "aq-devtools-stat");

    const label = document.createElement("span");
    paintClasses(label, "aq-devtools-stat-label");
    label.textContent = item.label;

    const value = document.createElement("span");
    paintClasses(
      value,
      "aq-devtools-stat-value",
      item.tone ? `aq-devtools-stat-value--${item.tone}` : ""
    );
    value.textContent = item.value;

    stat.append(label, value);
    grid.append(stat);
  }

  return grid;
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}

function booleanTone(value: boolean): "success" | "muted" {
  return value ? "success" : "muted";
}

function statusTone(status: string): "success" | "error" | "warning" | "muted" {
  if (status === "success") {
    return "success";
  }

  if (status === "error") {
    return "error";
  }

  if (status === "pending") {
    return "warning";
  }

  return "muted";
}

function fetchStatusTone(status: string): "success" | "error" | "warning" | "muted" {
  if (status === "fetching") {
    return "warning";
  }

  if (status === "paused") {
    return "warning";
  }

  return "muted";
}

function parseEditableJson(
  text: string
): { ok: true; value: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
    };
  }
}

function createSectionTitle(text: string): HTMLHeadingElement {
  const heading = document.createElement("h3");
  applyStyle(heading, {
    margin: "0 0 0.625rem",
    fontSize: "0.8125rem",
    fontWeight: "600",
    lineHeight: "1.2",
    color: "var(--aq-muted-foreground)",
  });
  heading.textContent = text;
  return heading;
}

function createJsonSection(
  title: string,
  value: unknown,
  options: { rootLabel?: string; onApply?: (next: unknown) => void } = {}
): HTMLDivElement {
  const { rootLabel = title.toLowerCase(), onApply } = options;
  const readOnly = !onApply;

  const section = document.createElement("div");
  paintClasses(section, "aq-devtools-section");
  section.append(createSectionTitle(title));

  const modes = document.createElement("div");
  paintClasses(modes, "aq-devtools-data-modes");

  const treeMode = document.createElement("button");
  treeMode.type = "button";
  paintClasses(treeMode, "aq-devtools-tab", "is-active");
  treeMode.textContent = "Tree";

  const secondMode = document.createElement("button");
  secondMode.type = "button";
  paintClasses(secondMode, "aq-devtools-tab");
  secondMode.textContent = readOnly ? "JSON" : "Edit";

  const viewport = document.createElement("div");
  paintClasses(viewport, "aq-devtools-data-viewport");

  const renderTree = (): void => {
    paintClasses(treeMode, "aq-devtools-tab", "is-active");
    paintClasses(secondMode, "aq-devtools-tab");
    viewport.replaceChildren(createJsonTree(value, rootLabel));
  };

  const renderSecond = (): void => {
    paintClasses(treeMode, "aq-devtools-tab");
    paintClasses(secondMode, "aq-devtools-tab", "is-active");

    if (readOnly) {
      const pre = document.createElement("pre");
      paintClasses(pre, "aq-devtools-pre");
      pre.textContent = formatJson(value);
      viewport.replaceChildren(pre);
      return;
    }

    const editor = document.createElement("textarea");
    paintClasses(editor, "aq-devtools-editor");
    editor.spellcheck = false;
    editor.value = formatJson(value);

    const feedback = document.createElement("div");
    paintClasses(feedback, "aq-devtools-editor-feedback");

    const actions = document.createElement("div");
    paintClasses(actions, "aq-devtools-actions");

    const applyButton = document.createElement("button");
    applyButton.type = "button";
    paintClasses(applyButton, "aq-devtools-btn", "aq-devtools-btn--primary");
    applyButton.textContent = "Apply";

    applyButton.addEventListener("click", () => {
      const parsed = parseEditableJson(editor.value);
      if (!parsed.ok) {
        feedback.textContent = parsed.error;
        feedback.dataset.tone = "error";
        return;
      }

      onApply(parsed.value);
      feedback.textContent = "Cache updated";
      feedback.dataset.tone = "success";
    });

    actions.append(applyButton);
    viewport.replaceChildren(editor, actions, feedback);
  };

  treeMode.addEventListener("click", renderTree);
  secondMode.addEventListener("click", renderSecond);
  modes.append(treeMode, secondMode);
  renderTree();

  section.append(modes, viewport);
  return section;
}

function scrollSelectedListItemIntoView(container: HTMLElement): void {
  container.querySelector<HTMLElement>(".aq-devtools-item.is-selected")?.scrollIntoView({
    block: "nearest",
  });
}

function createQueryListItem(
  entry: QueryDevtoolsEntryView,
  isSelected: boolean,
  showAdapter: boolean,
  badgeTheme: AdapterBadgeTheme,
  onSelect: (entry: QueryDevtoolsEntryView) => void
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  paintClasses(button, "aq-devtools-item", isSelected ? "is-selected" : "");

  const header = document.createElement("div");
  paintClasses(header, "aq-devtools-item-header");

  if (showAdapter) {
    header.append(createAdapterBadge(entry.adapterName, badgeTheme));
  }

  const key = document.createElement("div");
  paintClasses(key, "aq-devtools-item-key");
  key.textContent = formatQueryKeyLabel(
    entry.key,
    showAdapter ? { omitAdapterName: entry.adapterName } : undefined
  );
  key.title = formatKeyJson(entry.key);
  header.append(key);

  const badges = document.createElement("div");
  paintClasses(badges, "aq-devtools-badges");
  appendQueryBadges(badges, entry);

  button.append(header, badges);
  button.addEventListener("click", () => {
    onSelect(entry);
  });

  return button;
}

function createMutationListItem(
  entry: MutationDevtoolsEntryView,
  isSelected: boolean,
  showAdapter: boolean,
  badgeTheme: AdapterBadgeTheme,
  onSelect: (entry: MutationDevtoolsEntryView) => void
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  paintClasses(button, "aq-devtools-item", isSelected ? "is-selected" : "");

  const header = document.createElement("div");
  paintClasses(header, "aq-devtools-item-header");

  if (showAdapter) {
    header.append(createAdapterBadge(entry.adapterName, badgeTheme));
  }

  const key = document.createElement("div");
  paintClasses(key, "aq-devtools-item-key");
  key.textContent = `${entry.id} · ${entry.status}`;
  header.append(key);

  const badges = document.createElement("div");
  paintClasses(badges, "aq-devtools-badges");
  badges.append(createBadge(entry.status, entry.status === "success" ? "success" : entry.status));

  button.append(header, badges);
  button.addEventListener("click", () => {
    onSelect(entry);
  });

  return button;
}

export function mountQueryDevtools(options: QueryDevtoolsMountOptions): QueryDevtoolsController {
  const {
    position = "bottom",
    initialOpen = false,
    theme = "system",
    toggleCorner = DEFAULT_TOGGLE_CORNER,
    persistToggleCorner = true,
    toggleCornerStorageKey = DEFAULT_TOGGLE_CORNER_STORAGE_KEY,
    persistPreferences = true,
    preferencesStorageKey = DEFAULT_PREFERENCES_STORAGE_KEY,
    followLatest: followLatestOption = false,
    rememberOpenState: rememberOpenStateOption = false,
    zIndex = 60,
  } = options;
  const merged = createMergedQueryDevtools(resolveQueryDevtoolsStores(options));
  const savedPreferences = persistPreferences
    ? loadPanelPreferences(preferencesStorageKey, {
        filter: options.filter,
        followLatest: followLatestOption,
        initialOpen,
        rememberOpenState: rememberOpenStateOption,
      })
    : createPanelPreferences({
        filter: options.filter,
        followLatest: followLatestOption,
        initialOpen,
        rememberOpenState: rememberOpenStateOption,
      });

  let rememberOpenState = savedPreferences.rememberOpenState;
  let isOpen = rememberOpenState ? savedPreferences.isOpen : initialOpen;
  let activeTab = savedPreferences.activeTab;
  let selectedQueryEntryId: string | null = null;
  let selectedMutationEntryId: string | null = null;
  let search = savedPreferences.search;
  let selectedAdapterId = savedPreferences.selectedAdapterId;
  let querySort: QuerySortOption = savedPreferences.querySort;
  let mutationSort: MutationSortOption = savedPreferences.mutationSort;
  let followLatest = savedPreferences.followLatest;
  let mobilePanelHeight = savedPreferences.mobilePanelHeight;
  let mobileStackView: "list" | "detail" = "list";
  let scheduled = false;
  let fetchDurationTimer: ReturnType<typeof setInterval> | null = null;
  let showAdapterLabels = resolveQueryDevtoolsStores(options).length > 1;
  let currentToggleCorner = persistToggleCorner
    ? loadToggleCorner(toggleCornerStorageKey, toggleCorner)
    : toggleCorner;

  const root = document.createElement("div");
  applyDevtoolsThemeClass(root, theme);
  let unbindTheme = (): void => undefined;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Toggle Alpine Query Devtools");
  const toggleDot = document.createElement("span");
  applyStyle(toggleDot, {
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: "9999px",
    background: "var(--aq-brand)",
    boxShadow: "0 0 0 3px color-mix(in srgb, var(--aq-brand) 25%, transparent)",
    flexShrink: "0",
  });
  const toggleLabel = document.createElement("span");
  toggle.append(toggleDot, toggleLabel);
  applyToggleCorner(toggle, currentToggleCorner);

  const panel = document.createElement("section");
  paintClasses(panel, "aq-devtools-panel", `aq-devtools-panel--${position}`);

  const header = document.createElement("header");
  paintClasses(header, "aq-devtools-header");

  const headerTop = document.createElement("div");
  paintClasses(headerTop, "aq-devtools-header-top");

  const brand = document.createElement("div");
  paintClasses(brand, "aq-devtools-brand");

  const title = document.createElement("div");
  paintClasses(title, "aq-devtools-title");
  title.textContent = "Alpine Query";

  const subtitle = document.createElement("div");
  paintClasses(subtitle, "aq-devtools-subtitle");

  brand.append(title, subtitle);

  const searchInput = document.createElement("input");
  paintClasses(searchInput, "aq-devtools-search");
  searchInput.type = "search";
  searchInput.placeholder = "Filter by query key…";
  searchInput.value = search;

  const tabs = document.createElement("div");
  paintClasses(tabs, "aq-devtools-tabs");

  const queriesTab = document.createElement("button");
  queriesTab.type = "button";
  paintClasses(queriesTab, "aq-devtools-tab");
  queriesTab.textContent = "Queries";

  const mutationsTab = document.createElement("button");
  mutationsTab.type = "button";
  paintClasses(mutationsTab, "aq-devtools-tab");
  mutationsTab.textContent = "Mutations";

  const adapterSelect = document.createElement("select");
  paintSelect(adapterSelect, "aq-devtools-select", "aq-devtools-select--adapter");
  adapterSelect.hidden = true;
  adapterSelect.setAttribute("aria-label", "Filter by adapter");

  const cornerSelect = document.createElement("select");
  paintSelect(cornerSelect, "aq-devtools-select");
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

  adapterSelect.addEventListener("change", () => {
    selectedAdapterId = adapterSelect.value;
    if (!followLatest) {
      selectedQueryEntryId = null;
      selectedMutationEntryId = null;
    }
    mobileStackView = "list";
    persistPanelPreferences();
    scheduleRender();
  });

  const sortSelect = document.createElement("select");
  paintSelect(sortSelect, "aq-devtools-select", "aq-devtools-select--sort");
  sortSelect.setAttribute("aria-label", "Sort list");

  const followLatestLabel = document.createElement("label");
  paintClasses(followLatestLabel, "aq-devtools-follow-latest");
  followLatestLabel.setAttribute(
    "title",
    "Always select the most recently updated query or mutation"
  );

  const followLatestInput = document.createElement("input");
  followLatestInput.type = "checkbox";
  followLatestInput.checked = followLatest;
  followLatestInput.setAttribute("aria-label", "Follow latest");

  const followLatestText = document.createElement("span");
  followLatestText.textContent = "Follow latest";

  followLatestLabel.append(followLatestInput, followLatestText);

  const rememberOpenLabel = document.createElement("label");
  paintClasses(rememberOpenLabel, "aq-devtools-follow-latest", "aq-devtools-remember-open");
  rememberOpenLabel.setAttribute("title", "Restore panel open or closed state after reload");

  const rememberOpenInput = document.createElement("input");
  rememberOpenInput.type = "checkbox";
  rememberOpenInput.checked = rememberOpenState;
  rememberOpenInput.setAttribute("aria-label", "Remember open");

  const rememberOpenText = document.createElement("span");
  rememberOpenText.textContent = "Remember open";

  rememberOpenLabel.append(rememberOpenInput, rememberOpenText);

  const persistPanelPreferences = (): void => {
    if (!persistPreferences) {
      return;
    }

    savePanelPreferences(preferencesStorageKey, {
      selectedAdapterId,
      querySort,
      mutationSort,
      search,
      activeTab,
      followLatest,
      mobilePanelHeight,
      isOpen,
      rememberOpenState,
    });
  };

  const persistOpenStateIfEnabled = (): void => {
    if (!rememberOpenState) {
      return;
    }

    persistPanelPreferences();
  };

  const disableFollowLatest = (): void => {
    if (!followLatest) {
      return;
    }

    followLatest = false;
    followLatestInput.checked = false;
    persistPanelPreferences();
  };

  sortSelect.addEventListener("change", () => {
    if (activeTab === "queries") {
      querySort = sortSelect.value as QuerySortOption;
    } else {
      mutationSort = sortSelect.value as MutationSortOption;
    }
    persistPanelPreferences();
    scheduleRender();
  });

  followLatestInput.addEventListener("change", () => {
    followLatest = followLatestInput.checked;
    persistPanelPreferences();
    scheduleRender();
  });

  rememberOpenInput.addEventListener("change", () => {
    rememberOpenState = rememberOpenInput.checked;
    persistPanelPreferences();
    scheduleRender();
  });

  const globalActionButton = document.createElement("button");
  globalActionButton.type = "button";
  paintClasses(
    globalActionButton,
    "aq-devtools-btn",
    "aq-devtools-btn--ghost",
    "aq-devtools-global-action"
  );

  globalActionButton.addEventListener("click", () => {
    const stores = merged.getStoresForScope(selectedAdapterId);

    if (activeTab === "queries") {
      for (const store of stores) {
        store.reset();
      }
      selectedQueryEntryId = null;
      mobileStackView = "list";
    } else {
      for (const store of stores) {
        store.clearMutations();
      }
      selectedMutationEntryId = null;
      mobileStackView = "list";
    }

    scheduleRender();
  });

  setToggleCorner(currentToggleCorner);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  paintClasses(closeButton, "aq-devtools-btn", "aq-devtools-btn--icon");
  closeButton.setAttribute("aria-label", "Close Alpine Query Devtools");
  closeButton.textContent = "×";

  const headerToolbar = document.createElement("div");
  paintClasses(headerToolbar, "aq-devtools-header-toolbar");

  const toolbarTop = document.createElement("div");
  const toolbarBottom = document.createElement("div");

  const body = document.createElement("div");
  paintClasses(body, "aq-devtools-body");

  const list = document.createElement("div");
  paintClasses(list, "aq-devtools-list");

  const detail = document.createElement("div");
  paintClasses(detail, "aq-devtools-detail");

  const mobileBackButton = document.createElement("button");
  mobileBackButton.type = "button";
  paintClasses(mobileBackButton, "aq-devtools-btn", "aq-devtools-btn--ghost", "aq-devtools-back");
  mobileBackButton.setAttribute("aria-label", "Back to list");
  mobileBackButton.textContent = "← Back";
  mobileBackButton.hidden = true;

  const toolbarActions = document.createElement("div");
  paintClasses(toolbarActions, "aq-devtools-toolbar-actions");
  toolbarActions.append(mobileBackButton, globalActionButton);

  tabs.append(queriesTab, mutationsTab);
  headerTop.append(brand, cornerSelect, closeButton);
  toolbarTop.append(adapterSelect, sortSelect, tabs);
  toolbarBottom.append(searchInput, followLatestLabel, rememberOpenLabel, toolbarActions);
  headerToolbar.append(toolbarTop, toolbarBottom);
  header.append(headerTop, headerToolbar);
  body.append(list, detail);

  const resizeHandle = document.createElement("div");
  paintClasses(resizeHandle, "aq-devtools-resize-handle");
  resizeHandle.hidden = true;
  resizeHandle.setAttribute("role", "separator");
  resizeHandle.setAttribute("aria-orientation", "horizontal");
  resizeHandle.setAttribute("aria-label", "Resize panel height");

  const resizeGrip = document.createElement("span");
  paintClasses(resizeGrip, "aq-devtools-resize-grip");
  resizeHandle.append(resizeGrip);

  panel.append(resizeHandle, header, body);
  root.append(toggle, panel);
  document.body.append(root);

  const layoutTargets = {
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
    position,
  };

  const goToMobileList = (): void => {
    mobileStackView = "list";
    scheduleRender();
  };

  mobileBackButton.addEventListener("click", goToMobileList);

  const renderQueryDetail = (entry: QueryDevtoolsEntryView): void => {
    const store = merged.getStoreForQuery(entry);
    detail.replaceChildren();

    const detailHeader = document.createElement("div");
    paintClasses(detailHeader, "aq-devtools-detail-header");

    const detailTitle = document.createElement("div");
    paintClasses(detailTitle, "aq-devtools-item-header");

    if (showAdapterBadges()) {
      detailTitle.append(createAdapterBadge(entry.adapterName, adapterBadgeTheme()));
    }

    const detailKey = document.createElement("code");
    paintClasses(detailKey, "aq-devtools-detail-key");
    detailKey.textContent = formatQueryKeyLabel(entry.key, {
      omitAdapterName: showAdapterBadges() ? entry.adapterName : undefined,
    });
    detailKey.title = formatKeyJson(entry.key);
    detailTitle.append(detailKey);

    const detailBadges = document.createElement("div");
    paintClasses(detailBadges, "aq-devtools-badges");
    appendQueryBadges(detailBadges, entry);

    detailHeader.append(detailTitle, detailBadges);

    const detailContent = document.createElement("div");
    paintClasses(detailContent, "aq-devtools-detail-content");

    const actions = document.createElement("div");
    paintClasses(actions, "aq-devtools-section");
    actions.append(createSectionTitle("Actions"));

    const actionRow = document.createElement("div");
    paintClasses(actionRow, "aq-devtools-actions");

    const refetchButton = document.createElement("button");
    refetchButton.type = "button";
    paintClasses(refetchButton, "aq-devtools-btn", "aq-devtools-btn--primary");
    refetchButton.textContent = "Refetch";
    refetchButton.addEventListener("click", () => {
      void store.get(entry.key)?.refetch();
    });

    const invalidateButton = document.createElement("button");
    invalidateButton.type = "button";
    paintClasses(invalidateButton, "aq-devtools-btn");
    invalidateButton.textContent = "Invalidate";
    invalidateButton.addEventListener("click", () => {
      store.invalidate(entry.key);
    });

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    paintClasses(resetButton, "aq-devtools-btn");
    resetButton.textContent = "Reset";
    resetButton.addEventListener("click", () => {
      store.resetQueries(entry.key);
      scheduleRender();
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    paintClasses(removeButton, "aq-devtools-btn", "aq-devtools-btn--destructive");
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      store.remove(entry.key);
      selectedQueryEntryId = null;
      if (isCompactLayout()) {
        mobileStackView = "list";
      }
      scheduleRender();
    });

    actionRow.append(refetchButton, invalidateButton, resetButton, removeButton);
    actions.append(actionRow);

    const stateSection = document.createElement("div");
    paintClasses(stateSection, "aq-devtools-section");
    stateSection.append(createSectionTitle("State"));
    stateSection.append(
      createStatGrid([
        { label: "Status", value: entry.status, tone: statusTone(entry.status) },
        {
          label: "Fetch",
          value: entry.fetchStatus,
          tone: fetchStatusTone(entry.fetchStatus),
        },
        {
          label: "Duration",
          value: formatDuration(entry.fetchDurationMs),
          tone: entry.isFetching ? "warning" : "muted",
        },
        {
          label: "Loading",
          value: formatBoolean(entry.isLoading),
          tone: booleanTone(entry.isLoading),
        },
        {
          label: "Fetching",
          value: formatBoolean(entry.isFetching),
          tone: booleanTone(entry.isFetching),
        },
        {
          label: "Success",
          value: formatBoolean(entry.isSuccess),
          tone: booleanTone(entry.isSuccess),
        },
        {
          label: "Error",
          value: formatBoolean(entry.isError),
          tone: entry.isError ? "error" : "muted",
        },
        {
          label: "Stale",
          value: formatBoolean(entry.isStale),
          tone: entry.isStale ? "warning" : "muted",
        },
        { label: "Observers", value: String(entry.observers) },
        {
          label: "Invalidated",
          value: formatBoolean(entry.isInvalidated),
          tone: booleanTone(entry.isInvalidated),
        },
        { label: "Data updated", value: formatTime(entry.dataUpdatedAt), tone: "muted" },
        { label: "Error updated", value: formatTime(entry.errorUpdatedAt), tone: "muted" },
        {
          label: "Error",
          value: entry.error ? String(entry.error) : "None",
          tone: entry.error ? "error" : "muted",
        },
      ])
    );

    const optionsSection = createJsonSection("Options", entry.options, { rootLabel: "options" });

    const dataSection = createJsonSection("Data", entry.data, {
      rootLabel: "data",
      onApply: (next) => {
        store.setData(entry.key, next as never);
        scheduleRender();
      },
    });

    detailContent.append(actions, stateSection, optionsSection, dataSection);
    detail.append(detailHeader, detailContent);
  };

  const renderMutationDetail = (entry: MutationDevtoolsEntryView): void => {
    detail.replaceChildren();

    const detailHeader = document.createElement("div");
    paintClasses(detailHeader, "aq-devtools-detail-header");

    const detailTitle = document.createElement("div");
    paintClasses(detailTitle, "aq-devtools-item-header");

    if (showAdapterBadges()) {
      detailTitle.append(createAdapterBadge(entry.adapterName, adapterBadgeTheme()));
    }

    const detailKey = document.createElement("code");
    paintClasses(detailKey, "aq-devtools-detail-key");
    detailKey.textContent = entry.id;
    detailTitle.append(detailKey);

    const detailBadges = document.createElement("div");
    paintClasses(detailBadges, "aq-devtools-badges");
    detailBadges.append(
      createBadge(entry.status, entry.status === "success" ? "success" : entry.status)
    );

    detailHeader.append(detailTitle, detailBadges);

    const detailContent = document.createElement("div");
    paintClasses(detailContent, "aq-devtools-detail-content");

    const stateSection = document.createElement("div");
    paintClasses(stateSection, "aq-devtools-section");
    stateSection.append(createSectionTitle("Mutation"));
    stateSection.append(
      createStatGrid([
        { label: "Status", value: entry.status, tone: statusTone(entry.status) },
        { label: "Updated", value: formatTime(entry.updatedAt), tone: "muted" },
        {
          label: "Error",
          value: entry.error ? String(entry.error) : "None",
          tone: entry.error ? "error" : "muted",
        },
      ])
    );

    const variablesSection = createJsonSection("Variables", entry.variables, {
      rootLabel: "variables",
    });

    const dataSection = createJsonSection("Data", entry.data, { rootLabel: "result" });

    detailContent.append(stateSection, variablesSection, dataSection);
    detail.append(detailHeader, detailContent);
  };

  const matchesAdapter = (storeId: string): boolean =>
    selectedAdapterId === ALL_ADAPTERS_VALUE || storeId === selectedAdapterId;

  const showAdapterBadges = (): boolean =>
    showAdapterLabels && selectedAdapterId === ALL_ADAPTERS_VALUE;

  const adapterBadgeTheme = (): AdapterBadgeTheme =>
    root.classList.contains("aq-devtools-root--dark") ? "dark" : "light";

  const syncAdapterSelect = (): void => {
    const adapterOptions = merged.getAdapterOptions();
    const shouldShow = adapterOptions.length > 1;
    adapterSelect.hidden = !shouldShow;

    if (!shouldShow) {
      selectedAdapterId = ALL_ADAPTERS_VALUE;
      return;
    }

    const previous = adapterSelect.value || selectedAdapterId;
    adapterSelect.replaceChildren();

    const allOption = document.createElement("option");
    allOption.value = ALL_ADAPTERS_VALUE;
    allOption.textContent = "All adapters";
    adapterSelect.append(allOption);

    for (const option of adapterOptions) {
      const element = document.createElement("option");
      element.value = option.id;
      element.textContent = option.label;
      adapterSelect.append(element);
    }

    const nextValue =
      previous === ALL_ADAPTERS_VALUE || adapterOptions.some((option) => option.id === previous)
        ? previous
        : ALL_ADAPTERS_VALUE;

    selectedAdapterId = nextValue;
    adapterSelect.value = nextValue;
  };

  const syncSortSelect = (): void => {
    sortSelect.replaceChildren();

    if (activeTab === "queries") {
      for (const optionValue of QUERY_SORT_OPTIONS) {
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = querySortLabel(optionValue);
        sortSelect.append(option);
      }
      sortSelect.value = querySort;
      globalActionButton.textContent = "Reset cache";
      return;
    }

    for (const optionValue of MUTATION_SORT_OPTIONS) {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = mutationSortLabel(optionValue);
      sortSelect.append(option);
    }
    sortSelect.value = mutationSort;
    globalActionButton.textContent = "Clear mutations";
  };

  const emptyListMessage = (entity: "queries" | "mutations"): string => {
    if (selectedAdapterId !== ALL_ADAPTERS_VALUE) {
      return `No ${entity} for this adapter.`;
    }

    if (search.trim()) {
      return `No ${entity} match your filter.`;
    }

    return entity === "queries" ? "No queries cached yet." : "No mutations yet.";
  };

  const applyFollowLatestQuery = (queries: QueryDevtoolsEntryView[]): void => {
    if (!followLatest) {
      return;
    }

    const latest = pickLatestQuery(queries);
    if (!latest) {
      return;
    }

    selectedQueryEntryId = latest.entryId;
    if (isCompactLayout()) {
      mobileStackView = "detail";
    }
  };

  const renderQueryListItems = (queries: QueryDevtoolsEntryView[]): void => {
    for (const entry of queries) {
      list.append(
        createQueryListItem(
          entry,
          selectedQueryEntryId === entry.entryId,
          showAdapterBadges(),
          adapterBadgeTheme(),
          (next) => {
            disableFollowLatest();
            selectedQueryEntryId = next.entryId;
            if (isCompactLayout()) {
              mobileStackView = "detail";
            }
            scheduleRender();
          }
        )
      );
    }
  };

  const renderSelectedQueryDetail = (queries: QueryDevtoolsEntryView[]): void => {
    if (isCompactLayout()) {
      if (mobileStackView !== "detail") {
        return;
      }

      const selected = queries.find((entry) => entry.entryId === selectedQueryEntryId);
      if (selected) {
        renderQueryDetail(selected);
      } else {
        mobileStackView = "list";
      }
      return;
    }

    const selected = queries.find((entry) => entry.entryId === selectedQueryEntryId) ?? queries[0];
    if (!selected) {
      return;
    }

    selectedQueryEntryId = selected.entryId;
    renderQueryDetail(selected);
  };

  const applyFollowLatestMutation = (mutations: MutationDevtoolsEntryView[]): void => {
    if (!followLatest) {
      return;
    }

    const latest = pickLatestMutation(mutations);
    if (!latest) {
      return;
    }

    selectedMutationEntryId = latest.entryId;
    if (isCompactLayout()) {
      mobileStackView = "detail";
    }
  };

  const renderMutationListItems = (mutations: MutationDevtoolsEntryView[]): void => {
    for (const entry of mutations) {
      list.append(
        createMutationListItem(
          entry,
          selectedMutationEntryId === entry.entryId,
          showAdapterBadges(),
          adapterBadgeTheme(),
          (next) => {
            disableFollowLatest();
            selectedMutationEntryId = next.entryId;
            if (isCompactLayout()) {
              mobileStackView = "detail";
            }
            scheduleRender();
          }
        )
      );
    }
  };

  const renderSelectedMutationDetail = (mutations: MutationDevtoolsEntryView[]): void => {
    if (isCompactLayout()) {
      if (mobileStackView !== "detail") {
        return;
      }

      const selected = mutations.find((entry) => entry.entryId === selectedMutationEntryId);
      if (selected) {
        renderMutationDetail(selected);
      } else {
        mobileStackView = "list";
      }
      return;
    }

    const selected =
      mutations.find((entry) => entry.entryId === selectedMutationEntryId) ?? mutations[0];
    if (!selected) {
      return;
    }

    selectedMutationEntryId = selected.entryId;
    renderMutationDetail(selected);
  };

  const renderQueries = (snapshot: QueryDevtoolsSnapshotView): void => {
    const queries = sortQueries(
      snapshot.queries.filter(
        (entry) =>
          matchesAdapter(entry.storeId) &&
          matchesFilter(`${entry.adapterName} ${formatKeyJson(entry.key)}`, search)
      ),
      querySort
    );

    if (queries.length === 0) {
      list.append(createEmptyState(emptyListMessage("queries")));
      return;
    }

    list.append(createListHeader("Queries", queries.length));
    applyFollowLatestQuery(queries);
    renderQueryListItems(queries);
    scrollSelectedListItemIntoView(list);
    renderSelectedQueryDetail(queries);
  };

  const renderMutations = (snapshot: QueryDevtoolsSnapshotView): void => {
    const mutations = sortMutations(
      snapshot.mutations.filter(
        (entry) =>
          matchesAdapter(entry.storeId) &&
          matchesFilter(`${entry.adapterName} ${entry.id} ${formatJson(entry.variables)}`, search)
      ),
      mutationSort
    );

    if (mutations.length === 0) {
      list.append(createEmptyState(emptyListMessage("mutations")));
      return;
    }

    list.append(createListHeader("Mutations", mutations.length));
    applyFollowLatestMutation(mutations);
    renderMutationListItems(mutations);
    scrollSelectedListItemIntoView(list);
    renderSelectedMutationDetail(mutations);
  };

  const syncMobileStackView = (): void => {
    if (!isCompactLayout()) {
      list.style.removeProperty("display");
      detail.style.removeProperty("display");
      mobileBackButton.hidden = true;
      return;
    }

    const activeSelection =
      activeTab === "queries" ? selectedQueryEntryId : selectedMutationEntryId;

    if (mobileStackView === "detail" && !activeSelection) {
      mobileStackView = "list";
    }

    const showDetail = mobileStackView === "detail";
    mobileBackButton.hidden = !showDetail || followLatest;

    if (showDetail) {
      list.style.display = "none";
      detail.style.removeProperty("display");
      return;
    }

    list.style.removeProperty("display");
    detail.style.display = "none";
  };

  const syncFetchDurationTimer = (snapshot: QueryDevtoolsSnapshotView): void => {
    const hasInFlight = snapshot.queries.some(
      (entry) => entry.fetchStatus === "fetching" && entry.fetchStartedAt !== null
    );

    if (isOpen && hasInFlight) {
      if (!fetchDurationTimer) {
        fetchDurationTimer = setInterval(scheduleRender, 100);
      }
      return;
    }

    if (fetchDurationTimer) {
      clearInterval(fetchDurationTimer);
      fetchDurationTimer = null;
    }
  };

  const render = (): void => {
    scheduled = false;
    const snapshot = merged.getSnapshotView();
    showAdapterLabels = merged.getAdapterOptions().length > 1;
    syncAdapterSelect();
    syncSortSelect();

    toggleLabel.textContent = `Query (${snapshot.queries.length})`;
    title.textContent = "Alpine Query";
    subtitle.textContent = showAdapterLabels ? "" : (snapshot.adapterName ?? "");
    subtitle.style.display = subtitle.textContent ? "" : "none";
    paintClasses(
      panel,
      "aq-devtools-panel",
      `aq-devtools-panel--${position}`,
      isOpen ? "is-open" : ""
    );
    toggle.hidden = isOpen;
    paintClasses(queriesTab, "aq-devtools-tab", activeTab === "queries" ? "is-active" : "");
    paintClasses(mutationsTab, "aq-devtools-tab", activeTab === "mutations" ? "is-active" : "");
    followLatestInput.checked = followLatest;
    rememberOpenInput.checked = rememberOpenState;
    applyResponsiveLayout(layoutTargets, isCompactLayout(), mobilePanelHeight);

    list.replaceChildren();
    detail.replaceChildren();

    if (activeTab === "queries") {
      renderQueries(snapshot);
    } else {
      renderMutations(snapshot);
    }

    syncMobileStackView();
    syncFetchDurationTimer(snapshot);
  };

  const scheduleRender = (): void => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(render);
  };

  const unbindMobilePanelResize = bindMobilePanelResize({
    panel,
    handle: resizeHandle,
    onResize: (height) => {
      mobilePanelHeight = height;
      persistPanelPreferences();
    },
  });

  const syncMobilePanelHeight = (): void => {
    if (!isCompactLayout() || position !== "bottom") {
      return;
    }

    applyMobilePanelHeight(panel, resolveMobilePanelHeight(mobilePanelHeight));
  };

  const unbindResponsiveLayout = bindPanelResponsiveLayout(
    layoutTargets,
    () => {
      if (isCompactLayout()) {
        mobileStackView = "list";
      }
      syncMobilePanelHeight();
      scheduleRender();
    },
    () => mobilePanelHeight
  );

  window.addEventListener("resize", syncMobilePanelHeight);

  const applyZIndex = (): void => {
    if (zIndex === undefined) {
      return;
    }
    root.style.position = "relative";
    root.style.zIndex = String(zIndex);
    toggle.style.zIndex = String(zIndex);
    panel.style.zIndex = String(zIndex);
  };

  unbindTheme = bindDevtoolsTheme(root, theme, () => {
    scheduleRender();
    applyZIndex();
  });

  applyZIndex();
  render();
  const unsubscribe = merged.devtools.subscribe(scheduleRender);

  searchInput.addEventListener("input", () => {
    search = searchInput.value;
    persistPanelPreferences();
    scheduleRender();
  });

  toggle.addEventListener("click", () => {
    isOpen = !isOpen;
    persistOpenStateIfEnabled();
    scheduleRender();
  });

  closeButton.addEventListener("click", () => {
    isOpen = false;
    persistOpenStateIfEnabled();
    scheduleRender();
  });

  queriesTab.addEventListener("click", () => {
    activeTab = "queries";
    mobileStackView = "list";
    persistPanelPreferences();
    scheduleRender();
  });

  mutationsTab.addEventListener("click", () => {
    activeTab = "mutations";
    mobileStackView = "list";
    persistPanelPreferences();
    scheduleRender();
  });

  return {
    open() {
      isOpen = true;
      persistOpenStateIfEnabled();
      scheduleRender();
    },
    close() {
      isOpen = false;
      persistOpenStateIfEnabled();
      scheduleRender();
    },
    toggle() {
      isOpen = !isOpen;
      persistOpenStateIfEnabled();
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
      if (fetchDurationTimer) {
        clearInterval(fetchDurationTimer);
      }
      unbindMobilePanelResize();
      unbindResponsiveLayout();
      window.removeEventListener("resize", syncMobilePanelHeight);
      unbindTheme();
      root.remove();
    },
  };
}

export function getQueryStore(
  source: QueryStore | { store(name: string): unknown },
  storeName = "query"
): QueryStore {
  if (isQueryStore(source)) {
    assertQueryStoreWithDevtools(source);
    return source;
  }

  const store = source.store(storeName) as QueryStore | undefined;

  if (!store?.devtools) {
    throw new Error(
      `@ailuracode/alpinejs-query-devtools could not find $store.${storeName}. Register @ailuracode/alpinejs-query first.`
    );
  }

  return store;
}

function isQueryStore(value: unknown): value is QueryStore {
  return (
    typeof value === "object" &&
    value !== null &&
    "devtools" in value &&
    typeof (value as QueryStore).observe === "function"
  );
}

function assertQueryStoreWithDevtools(store: QueryStore): void {
  if (!store.devtools) {
    throw new Error(
      "@ailuracode/alpinejs-query-devtools requires @ailuracode/alpinejs-query with devtools support"
    );
  }
}
