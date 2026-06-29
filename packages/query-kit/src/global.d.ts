/// <reference types="@types/alpinejs" />

export type ToggleCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface QueryDevtoolsPluginOptions {
  position?: "bottom" | "right";
  toggleCorner?: ToggleCorner;
  persistToggleCorner?: boolean;
  toggleCornerStorageKey?: string;
  persistPreferences?: boolean;
  preferencesStorageKey?: string;
  followLatest?: boolean;
  initialOpen?: boolean;
  filter?: string;
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
