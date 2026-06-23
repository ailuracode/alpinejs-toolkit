import type {
  QueryDevtoolsEntry,
  QueryDevtoolsSnapshot,
  QueryStore,
} from "@ailuracode/alpine-query";

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
  /** Start with the panel open. Default: `false`. */
  initialOpen?: boolean;
  /** Filter queries and mutations by search text. */
  filter?: string;
  /** Custom store name. Default: `query`. */
  storeName?: string;
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
  store: QueryStore;
};

export type { QueryDevtoolsEntry, QueryDevtoolsSnapshot };
