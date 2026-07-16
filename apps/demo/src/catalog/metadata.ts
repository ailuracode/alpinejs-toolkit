import type { PackageCategory, PackageFamily } from "./types.js";

export const PACKAGE_CATEGORIES: readonly PackageCategory[] = [
  {
    id: "runtime-composition",
    title: "Runtime & Composition",
    summary:
      "Plugin registry, overlay portal, keyboard routing, directives, and shared composition primitives.",
    order: 1,
  },
  {
    id: "application-shell",
    title: "Application Shell",
    summary: "Theme, layout, scroll, sidebar, and language preferences for app shells.",
    order: 2,
  },
  {
    id: "browser-capabilities",
    title: "Browser Capabilities",
    summary: "Environment signals, transfer APIs, notifications, geolocation, and permissions.",
    order: 3,
  },
  {
    id: "interaction-primitives",
    title: "Interaction Primitives",
    summary: "Toggle state, child composition, and pointer gesture recognition.",
    order: 4,
  },
  {
    id: "headless-ui",
    title: "Headless UI",
    summary: "Accessible dialog, menu, tooltip, toast, tabs, and related UI state machines.",
    order: 5,
  },
  {
    id: "data-networking",
    title: "Data & Networking",
    summary: "Query cache, JSON:API client, calendars, and data-fetching adapters.",
    order: 6,
  },
] as const;

export const PACKAGE_FAMILIES: readonly PackageFamily[] = [
  {
    id: "registry",
    category: "runtime-composition",
    title: "Plugin Registry",
    summary: "Lazy plugin registration and Alpine initialization for application entrypoints.",
    order: 1,
  },
  {
    id: "permissions",
    category: "browser-capabilities",
    title: "Permissions",
    summary:
      "Unified browser permission registry with capability adapters from notify, geo, and attention.",
    order: 1,
  },
  {
    id: "query-stack",
    category: "data-networking",
    title: "Query Stack",
    summary:
      "Store-agnostic query cache with Alpine and Zustand adapters, recommended kit bundle, and devtools.",
    order: 1,
  },
] as const;
