import type {
  QueryDevtoolsEntry,
  QueryDevtoolsSnapshot,
  QueryStore,
} from "@ailuracode/alpinejs-query";

export type ToggleCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface QueryDevtoolsPluginOptions {
  /** Panel position. Default: `bottom`. */
  position?: "bottom" | "right";
  /** Toggle button corner. Default: `bottom-right`. */
  toggleCorner?: ToggleCorner;
  /** Persist toggle corner in `localStorage`. Default: `true`. */
  persistToggleCorner?: boolean;
  /** `localStorage` key for the toggle corner. */
  toggleCornerStorageKey?: string;
  /** Persist panel filters, sort, tab, and follow-latest in `localStorage`. Default: `true`. */
  persistPreferences?: boolean;
  /** `localStorage` key for panel preferences. */
  preferencesStorageKey?: string;
  /** Start with follow-latest enabled. Default: `false`. */
  followLatest?: boolean;
  /** Start with remember-open-state enabled. Default: `false`. */
  rememberOpenState?: boolean;
  /** Start with the panel open. Default: `false`. */
  initialOpen?: boolean;
  /** Filter queries and mutations by search text. */
  filter?: string;
  /** Color theme. Default: follows host (`data-theme`, `.dark`, or system preference). */
  theme?: "light" | "dark" | "system";
  /** Custom store name. Default: `query`. */
  storeName?: string;
  /** Extra query clients to inspect alongside `$store.query` (e.g. headless `createQueryClient()`). */
  additionalStores?: QueryStore[];
  /**
   * Custom z-index for the devtools panel and toggle button.
   * Default: `2147483646` (panel) and `2147483647` (toggle).
   * Set lower if the devtools overlaps other UI elements (e.g. a sidebar).
   */
  zIndex?: number;
}

export interface QueryDevtoolsController {
  open(): void;
  close(): void;
  toggle(): void;
  setToggleCorner(corner: ToggleCorner): void;
  getToggleCorner(): ToggleCorner;
  destroy(): void;
}

export type QueryDevtoolsMountOptions = QueryDevtoolsPluginOptions & {
  /** Primary query store. */
  store?: QueryStore;
  /** Replace `store` with an explicit list of query stores. */
  stores?: QueryStore[];
};

export type { QueryDevtoolsEntry, QueryDevtoolsSnapshot };
