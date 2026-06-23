import {
  MUTATION_SORT_OPTIONS,
  type MutationSortOption,
  QUERY_SORT_OPTIONS,
  type QuerySortOption,
} from "./sort.js";

export const DEFAULT_PREFERENCES_STORAGE_KEY = "alpine-query-devtools:preferences";
export const ALL_ADAPTERS_VALUE = "all";

export type PanelTab = "queries" | "mutations";

export type PanelPreferences = {
  selectedAdapterId: string;
  querySort: QuerySortOption;
  mutationSort: MutationSortOption;
  search: string;
  activeTab: PanelTab;
  followLatest: boolean;
  mobilePanelHeight: number | null;
  isOpen: boolean;
  rememberOpenState: boolean;
};

export type PanelPreferencesDefaults = {
  filter?: string;
  followLatest?: boolean;
  initialOpen?: boolean;
  rememberOpenState?: boolean;
};

const DEFAULT_PREFERENCES: PanelPreferences = {
  selectedAdapterId: ALL_ADAPTERS_VALUE,
  querySort: "updated-desc",
  mutationSort: "updated-desc",
  search: "",
  activeTab: "queries",
  followLatest: false,
  mobilePanelHeight: null,
  isOpen: false,
  rememberOpenState: false,
};

function isQuerySort(value: unknown): value is QuerySortOption {
  return typeof value === "string" && (QUERY_SORT_OPTIONS as readonly string[]).includes(value);
}

function isMutationSort(value: unknown): value is MutationSortOption {
  return typeof value === "string" && (MUTATION_SORT_OPTIONS as readonly string[]).includes(value);
}

function isPanelTab(value: unknown): value is PanelTab {
  return value === "queries" || value === "mutations";
}

function readOptionalBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function readOptionalString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeMobilePanelHeight(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  return DEFAULT_PREFERENCES.mobilePanelHeight;
}

function normalizePreferences(
  value: unknown,
  defaults: PanelPreferencesDefaults = {}
): PanelPreferences {
  const source =
    typeof value === "object" && value !== null ? (value as Partial<PanelPreferences>) : {};

  return {
    selectedAdapterId:
      typeof source.selectedAdapterId === "string" && source.selectedAdapterId.length > 0
        ? source.selectedAdapterId
        : DEFAULT_PREFERENCES.selectedAdapterId,
    querySort: isQuerySort(source.querySort) ? source.querySort : DEFAULT_PREFERENCES.querySort,
    mutationSort: isMutationSort(source.mutationSort)
      ? source.mutationSort
      : DEFAULT_PREFERENCES.mutationSort,
    search: readOptionalString(source.search, defaults.filter ?? DEFAULT_PREFERENCES.search),
    activeTab: isPanelTab(source.activeTab) ? source.activeTab : DEFAULT_PREFERENCES.activeTab,
    followLatest: readOptionalBoolean(
      source.followLatest,
      defaults.followLatest ?? DEFAULT_PREFERENCES.followLatest
    ),
    mobilePanelHeight: normalizeMobilePanelHeight(source.mobilePanelHeight),
    isOpen: readOptionalBoolean(source.isOpen, defaults.initialOpen ?? DEFAULT_PREFERENCES.isOpen),
    rememberOpenState: readOptionalBoolean(
      source.rememberOpenState,
      defaults.rememberOpenState ?? DEFAULT_PREFERENCES.rememberOpenState
    ),
  };
}

export function loadPanelPreferences(
  storageKey: string,
  defaults: PanelPreferencesDefaults = {}
): PanelPreferences {
  if (typeof localStorage === "undefined") {
    return normalizePreferences(null, defaults);
  }

  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      return normalizePreferences(null, defaults);
    }

    return normalizePreferences(JSON.parse(saved) as unknown, defaults);
  } catch {
    return normalizePreferences(null, defaults);
  }
}

export function savePanelPreferences(storageKey: string, preferences: PanelPreferences): void {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function createPanelPreferences(defaults: PanelPreferencesDefaults = {}): PanelPreferences {
  return normalizePreferences(null, defaults);
}
