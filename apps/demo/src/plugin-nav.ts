export type PluginKind = "store" | "magic" | "core";

export type PluginTier = "essential" | "extended" | "advanced";

export type PluginNavItem = {
  id: string;
  title: string;
  package: string;
  api: string;
  kind: PluginKind;
  tier: PluginTier;
  description: string;
};

export type PluginNavGroup = {
  id: string;
  label: string;
  items: PluginNavItem[];
};

/** Single source of truth for sidebar navigation and demo section anchors. */
export const PLUGIN_NAV_GROUPS: PluginNavGroup[] = [
  {
    id: "essentials",
    label: "Essentials",
    items: [
      {
        id: "theme",
        title: "Theme",
        package: "@ailuracode/alpinejs-theme",
        api: "$store.theme",
        kind: "store",
        tier: "essential",
        description:
          "Light, dark, and system color modes with persistence. Use onChange callbacks to apply classes or data attributes — no CSS framework is baked in.",
      },
      {
        id: "screen",
        title: "Screen",
        package: "@ailuracode/alpinejs-screen",
        api: "$store.device",
        kind: "store",
        tier: "essential",
        description:
          "Reactive viewport breakpoints (mobile, tablet, desktop) and dimensions. Drives responsive sidebar behavior in this demo.",
      },
      {
        id: "scroll",
        title: "Scroll",
        package: "@ailuracode/alpinejs-scroll",
        api: "$store.scroll",
        kind: "store",
        tier: "essential",
        description:
          "Scroll position, direction, progress, and body scroll lock. The sticky header progress bar and sidebar overlay lock both use this store.",
      },
      {
        id: "sidebar",
        title: "Sidebar",
        package: "@ailuracode/alpinejs-sidebar",
        api: "$store.sidebar",
        kind: "store",
        tier: "essential",
        description:
          "Open, close, and collapse state for app shells. Compose with scroll lock on overlay open. This demo app uses the sidebar you are navigating right now.",
      },
      {
        id: "toast",
        title: "Toast",
        package: "@ailuracode/alpinejs-toast",
        api: "$toast",
        kind: "magic",
        tier: "essential",
        description:
          "Headless toast queue with timed and persistent stacks. Use fromPayload for plain event or server payloads. This demo renders Sonner-style UI in SonnerToasts.astro.",
      },
    ],
  },
  {
    id: "environment",
    label: "Environment",
    items: [
      {
        id: "network",
        title: "Network",
        package: "@ailuracode/alpinejs-network",
        api: "$network",
        kind: "magic",
        tier: "extended",
        description: "Online/offline status and connection type from the Network Information API.",
      },
      {
        id: "visibility",
        title: "Visibility",
        package: "@ailuracode/alpinejs-visibility",
        api: "$visibility",
        kind: "magic",
        tier: "extended",
        description: "Page visibility (visible, hidden, prerender) via the Page Visibility API.",
      },
      {
        id: "battery",
        title: "Battery",
        package: "@ailuracode/alpinejs-battery",
        api: "$battery",
        kind: "magic",
        tier: "advanced",
        description:
          "Battery level, charging state, and time-to-full/empty when the API is available.",
      },
      {
        id: "platform",
        title: "Platform",
        package: "@ailuracode/alpinejs-platform",
        api: "$platform",
        kind: "magic",
        tier: "extended",
        description:
          "Detected OS, architecture, and modifier keys for platform-aware UI shortcuts.",
      },
      {
        id: "touch",
        title: "Touch",
        package: "@ailuracode/alpinejs-touch",
        api: "$touch",
        kind: "magic",
        tier: "extended",
        description: "Coarse pointer and touch capability detection for adaptive interactions.",
      },
    ],
  },
  {
    id: "interaction",
    label: "Interactions",
    items: [
      {
        id: "toggle",
        title: "Toggle",
        package: "@ailuracode/alpinejs-toggle",
        api: "$toggle",
        kind: "magic",
        tier: "extended",
        description:
          "Binary and ternary toggle state factories for segmented controls and filters.",
      },
      {
        id: "clipboard",
        title: "Clipboard",
        package: "@ailuracode/alpinejs-clipboard",
        api: "$clipboard",
        kind: "magic",
        tier: "extended",
        description: "Async copy-to-clipboard helper with graceful fallback when unsupported.",
      },
      {
        id: "export",
        title: "Export",
        package: "@ailuracode/alpinejs-export",
        api: "$export",
        kind: "magic",
        tier: "advanced",
        description: "Download text or JSON blobs as files from the browser.",
      },
      {
        id: "share",
        title: "Share",
        package: "@ailuracode/alpinejs-share",
        api: "$share",
        kind: "magic",
        tier: "advanced",
        description:
          "Web Share API wrapper with canShare checks for title, text, and URL payloads.",
      },
      {
        id: "attention",
        title: "Attention",
        package: "@ailuracode/alpinejs-attention",
        api: "$wakelock · $idle",
        kind: "magic",
        tier: "advanced",
        description:
          "Screen Wake Lock and Idle Detection magics for keeping screens on or reacting to user idle state.",
      },
      {
        id: "notify",
        title: "Notify",
        package: "@ailuracode/alpinejs-notify",
        api: "$notify",
        kind: "magic",
        tier: "advanced",
        description:
          "Browser notifications and push permission helpers, including service worker registration.",
      },
    ],
  },
  {
    id: "data",
    label: "Data & APIs",
    items: [
      {
        id: "geo",
        title: "Geo",
        package: "@ailuracode/alpinejs-geo",
        api: "$store.geo",
        kind: "store",
        tier: "advanced",
        description:
          "Geolocation coordinates, accuracy, and permission state with watch/start/stop actions.",
      },
      {
        id: "calendar",
        title: "Calendar",
        package: "@ailuracode/alpinejs-calendar",
        api: "$calendar",
        kind: "magic",
        tier: "advanced",
        description:
          "Locale-aware month grids, navigation, and date selection without a UI framework.",
      },
      {
        id: "query",
        title: "Query",
        package: "@ailuracode/alpinejs-query",
        api: "$store.query",
        kind: "core",
        tier: "advanced",
        description:
          "Store-agnostic query cache with Nanostores, Alpine.reactive, and Zustand adapters. Open Query devtools (bottom-right) to inspect all three caches.",
      },
      {
        id: "json-api",
        title: "JSON:API",
        package: "@ailuracode/alpinejs-json-api",
        api: "$jsonapi",
        kind: "magic",
        tier: "advanced",
        description:
          "Typed JSON:API client with resource schemas, relationships, and compound document parsing.",
      },
    ],
  },
];

export const PLUGIN_NAV_ITEMS: PluginNavItem[] = PLUGIN_NAV_GROUPS.flatMap((group) => group.items);

export const ESSENTIAL_PLUGIN_IDS = PLUGIN_NAV_ITEMS.filter(
  (item) => item.tier === "essential"
).map((item) => item.id);

export function getPluginsByTier(tier: PluginTier): PluginNavItem[] {
  return PLUGIN_NAV_ITEMS.filter((item) => item.tier === tier);
}

export function getPluginNavItem(id: string): PluginNavItem | undefined {
  return PLUGIN_NAV_ITEMS.find((item) => item.id === id);
}

export function playgroundPath(id: string): string {
  return `/playground/${id}/`;
}

export function pluginDocsPath(id: string): string {
  return `/plugins/${id}/`;
}

/** Starlight sidebar entries for plugin doc pages, grouped by tier. */
export function pluginDocsSidebarItems(tier: PluginTier): { label: string; link: string }[] {
  return getPluginsByTier(tier).map((item) => ({
    label: item.title,
    link: `/plugins/${item.id}/`,
  }));
}
