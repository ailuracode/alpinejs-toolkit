export type PluginKind = "store" | "magic" | "directive" | "core";

export type PluginTier = "essential" | "extended" | "advanced" | "headless";

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
        package: "@ailuracode/alpine-theme",
        api: "$store.theme",
        kind: "store",
        tier: "essential",
        description:
          "Light, dark, and system color modes with persistence. Use onChange callbacks to apply classes or data attributes — no CSS framework is baked in.",
      },
      {
        id: "media",
        title: "Media",
        package: "@ailuracode/alpine-media",
        api: "$store.media",
        kind: "store",
        tier: "essential",
        description:
          "Reactive viewport breakpoints, dimensions, and browser media features (reduced motion, contrast, color scheme, hover, pointer, orientation). Drives responsive sidebar behavior in this demo.",
      },
      {
        id: "scroll",
        title: "Scroll",
        package: "@ailuracode/alpine-scroll",
        api: "$store.scroll",
        kind: "store",
        tier: "essential",
        description:
          "Scroll position, direction, progress, and body scroll lock. The sticky header progress bar and sidebar overlay lock both use this store.",
      },
      {
        id: "sidebar",
        title: "Sidebar",
        package: "@ailuracode/alpine-sidebar",
        api: "$store.sidebar",
        kind: "store",
        tier: "essential",
        description:
          "Open, close, and toggle visibility for app shells. Visual width (rail, mini, expanded) is owned by the consumer via local Alpine state. Compose with scroll lock on overlay open. This demo app uses the sidebar you are navigating right now.",
      },
    ],
  },
  {
    id: "environment",
    label: "Environment",
    items: [
      {
        id: "env",
        title: "Env",
        package: "@ailuracode/alpine-env",
        api: "$network · $visibility · $battery · $platform",
        kind: "magic",
        tier: "extended",
        description:
          "Browser environment magics: online/offline, tab visibility, battery, and OS detection in one plugin.",
      },
      {
        id: "transfer",
        title: "Transfer",
        package: "@ailuracode/alpine-transfer",
        api: "$clipboard · $share · $export",
        kind: "magic",
        tier: "extended",
        description:
          "Outbound data transfer: clipboard copy, Web Share API, and programmatic downloads.",
      },
      {
        id: "attention",
        title: "Attention",
        package: "@ailuracode/alpine-attention",
        api: "$wakelock · $idle",
        kind: "magic",
        tier: "advanced",
        description: "Wake Lock and Idle Detection for presentations, media, and session-aware UI.",
      },
      {
        id: "notify",
        title: "Notify",
        package: "@ailuracode/alpine-notify",
        api: "$notify",
        kind: "magic",
        tier: "advanced",
        description:
          "Browser notifications and push permission helpers, including service worker registration.",
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
        package: "@ailuracode/alpine-toggle",
        api: "$toggle",
        kind: "magic",
        tier: "extended",
        description:
          "Binary and ternary toggle state factories for segmented controls and filters.",
      },
      {
        id: "child",
        title: "Child",
        package: "@ailuracode/alpine-child",
        api: "x-child",
        kind: "directive",
        tier: "extended",
        description:
          "asChild-style directive — merges wrapper attributes onto the first child via Alpine.morph(). Requires @alpinejs/morph.",
      },
    ],
  },
  {
    id: "headless-ui",
    label: "Headless UI",
    items: [
      {
        id: "dialog",
        title: "Dialog",
        package: "@ailuracode/alpine-dialog",
        api: "$store.dialog",
        kind: "store",
        tier: "headless",
        description:
          "Accessible modal state — focus trap, scroll-lock hooks, Escape/outside dismiss, and ARIA helpers.",
      },
      {
        id: "menu",
        title: "Menu",
        package: "@ailuracode/alpine-menu",
        api: "$store.menu",
        kind: "store",
        tier: "headless",
        description:
          "Dropdown and context menu state with exclusive open behavior, keyboard navigation, roving tabindex, and ARIA helpers.",
      },
      {
        id: "tooltip",
        title: "Tooltip",
        package: "@ailuracode/alpine-tooltip",
        api: "$store.tooltip",
        kind: "store",
        tier: "headless",
        description:
          "Tooltip open/close state with hover/focus delays. Pair with @alpinejs/anchor for placement.",
      },
      {
        id: "toast",
        title: "Toast",
        package: "@ailuracode/alpine-toast",
        api: "$toast",
        kind: "magic",
        tier: "headless",
        description:
          "Headless toast queue with timed and persistent stacks. Use fromPayload for plain event or server payloads. This demo renders Sonner-style UI in SonnerToasts.astro.",
      },
      {
        id: "tabs",
        title: "Tabs",
        package: "@ailuracode/alpine-tabs",
        api: "$store.tabs",
        kind: "store",
        tier: "headless",
        description:
          "Accessible tabs with keyboard navigation, ARIA props, and optional URL query sync.",
      },
      {
        id: "accordion",
        title: "Accordion",
        package: "@ailuracode/alpine-accordion",
        api: "$store.accordion",
        kind: "store",
        tier: "headless",
        description:
          "Single or multi-open accordion state with keyboard focus and ARIA helpers. Pair with @alpinejs/collapse for panel animation.",
      },
      {
        id: "command",
        title: "Command",
        package: "@ailuracode/alpine-command",
        api: "$store.command",
        kind: "store",
        tier: "headless",
        description:
          "Spotlight-style command palette — searchable actions, groups, shortcuts, and keyboard selection.",
      },
      {
        id: "carousel",
        title: "Carousel",
        package: "@ailuracode/alpine-carousel",
        api: "$store.carousel",
        kind: "store",
        tier: "headless",
        description:
          "Accessible carousel store powered by Embla — navigation, autoplay, loop, keyboard, and ARIA helpers.",
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
        package: "@ailuracode/alpine-geo",
        api: "$store.geo",
        kind: "store",
        tier: "advanced",
        description:
          "Geolocation coordinates, accuracy, and permission state with watch/start/stop actions.",
      },
      {
        id: "lang",
        title: "Lang",
        package: "@ailuracode/alpine-lang",
        api: "$store.lang",
        kind: "store",
        tier: "essential",
        description:
          "Detect the browser language, query and change the current application language. Pairs with any i18n library — does not translate content.",
      },
      {
        id: "calendar",
        title: "Calendar",
        package: "@ailuracode/alpine-calendar",
        api: "$calendar",
        kind: "magic",
        tier: "advanced",
        description:
          "Locale-aware month grids, navigation, and date selection without a UI framework.",
      },
      {
        id: "query",
        title: "Query",
        package: "@ailuracode/alpine-query",
        api: "$store.query",
        kind: "core",
        tier: "advanced",
        description:
          "Store-agnostic query cache with Nanostores, Alpine.reactive, and Zustand adapters. Open Query devtools (bottom-right) to inspect all three caches.",
      },
      {
        id: "query-kit",
        title: "Query kit",
        package: "@ailuracode/alpine-query-kit",
        api: "$store.query · devtools",
        kind: "core",
        tier: "advanced",
        description: "Recommended query stack: cache, Nanostores adapter, and devtools panel.",
      },
      {
        id: "json-api",
        title: "JSON:API",
        package: "@ailuracode/alpine-json-api",
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

export function getAdjacentPlugins(id: string): {
  prev?: PluginNavItem;
  next?: PluginNavItem;
} {
  const index = PLUGIN_NAV_ITEMS.findIndex((item) => item.id === id);
  if (index === -1) {
    return {};
  }

  return {
    prev: index > 0 ? PLUGIN_NAV_ITEMS[index - 1] : undefined,
    next: index < PLUGIN_NAV_ITEMS.length - 1 ? PLUGIN_NAV_ITEMS[index + 1] : undefined,
  };
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
