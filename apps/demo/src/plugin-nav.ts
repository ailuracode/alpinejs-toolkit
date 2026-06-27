export type PluginKind = "store" | "magic" | "core";

export type PluginNavItem = {
  id: string;
  title: string;
  package: string;
  api: string;
  kind: PluginKind;
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
    id: "layout",
    label: "Layout & stores",
    items: [
      {
        id: "theme",
        title: "Theme",
        package: "@ailuracode/alpine-theme",
        api: "$store.theme",
        kind: "store",
        description:
          "Light, dark, and system color modes with persistence. Use onChange callbacks to apply classes or data attributes — no CSS framework is baked in.",
      },
      {
        id: "sidebar",
        title: "Sidebar",
        package: "@ailuracode/alpine-sidebar",
        api: "$store.sidebar",
        kind: "store",
        description:
          "Open, close, and collapse state for app shells. Compose with scroll lock on overlay open. This demo app uses the sidebar you are navigating right now.",
      },
      {
        id: "screen",
        title: "Screen",
        package: "@ailuracode/alpine-screen",
        api: "$store.device",
        kind: "store",
        description:
          "Reactive viewport breakpoints (mobile, tablet, desktop) and dimensions. Drives responsive sidebar behavior in this demo.",
      },
      {
        id: "scroll",
        title: "Scroll",
        package: "@ailuracode/alpine-scroll",
        api: "$store.scroll",
        kind: "store",
        description:
          "Scroll position, direction, progress, and body scroll lock. The sticky header progress bar and sidebar overlay lock both use this store.",
      },
      {
        id: "geo",
        title: "Geo",
        package: "@ailuracode/alpine-geo",
        api: "$store.geo",
        kind: "store",
        description:
          "Geolocation coordinates, accuracy, and permission state with watch/start/stop actions.",
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
        package: "@ailuracode/alpine-network",
        api: "$network",
        kind: "magic",
        description: "Online/offline status and connection type from the Network Information API.",
      },
      {
        id: "visibility",
        title: "Visibility",
        package: "@ailuracode/alpine-visibility",
        api: "$visibility",
        kind: "magic",
        description: "Page visibility (visible, hidden, prerender) via the Page Visibility API.",
      },
      {
        id: "battery",
        title: "Battery",
        package: "@ailuracode/alpine-battery",
        api: "$battery",
        kind: "magic",
        description:
          "Battery level, charging state, and time-to-full/empty when the API is available.",
      },
      {
        id: "platform",
        title: "Platform",
        package: "@ailuracode/alpine-platform",
        api: "$platform",
        kind: "magic",
        description:
          "Detected OS, architecture, and modifier keys for platform-aware UI shortcuts.",
      },
      {
        id: "touch",
        title: "Touch",
        package: "@ailuracode/alpine-touch",
        api: "$touch",
        kind: "magic",
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
        package: "@ailuracode/alpine-toggle",
        api: "$toggle",
        kind: "magic",
        description:
          "Binary and ternary toggle state factories for segmented controls and filters.",
      },
      {
        id: "clipboard",
        title: "Clipboard",
        package: "@ailuracode/alpine-clipboard",
        api: "$clipboard",
        kind: "magic",
        description: "Async copy-to-clipboard helper with graceful fallback when unsupported.",
      },
      {
        id: "toast",
        title: "Toast",
        package: "@ailuracode/alpine-toast",
        api: "$toast",
        kind: "magic",
        description:
          "Headless toast queue with timed and persistent stacks. This demo renders Sonner-style UI in SonnerToasts.astro — markup is not part of the plugin.",
      },
      {
        id: "export",
        title: "Export",
        package: "@ailuracode/alpine-export",
        api: "$export",
        kind: "magic",
        description: "Download text or JSON blobs as files from the browser.",
      },
      {
        id: "share",
        title: "Share",
        package: "@ailuracode/alpine-share",
        api: "$share",
        kind: "magic",
        description:
          "Web Share API wrapper with canShare checks for title, text, and URL payloads.",
      },
      {
        id: "attention",
        title: "Attention",
        package: "@ailuracode/alpine-attention",
        api: "$wakelock · $idle",
        kind: "magic",
        description:
          "Screen Wake Lock and Idle Detection magics for keeping screens on or reacting to user idle state.",
      },
      {
        id: "notify",
        title: "Notify",
        package: "@ailuracode/alpine-notify",
        api: "$notify",
        kind: "magic",
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
        id: "calendar",
        title: "Calendar",
        package: "@ailuracode/alpine-calendar",
        api: "$calendar",
        kind: "magic",
        description:
          "Locale-aware month grids, navigation, and date selection without a UI framework.",
      },
      {
        id: "query",
        title: "Query",
        package: "@ailuracode/alpine-query",
        api: "$store.query",
        kind: "core",
        description:
          "Store-agnostic query cache with Nanostores, Alpine.reactive, and Zustand adapters. Open Query devtools (bottom-right) to inspect all three caches.",
      },
      {
        id: "json-api",
        title: "JSON:API",
        package: "@ailuracode/alpine-json-api",
        api: "$jsonapi",
        kind: "magic",
        description:
          "Typed JSON:API client with resource schemas, relationships, and compound document parsing.",
      },
    ],
  },
];

export const PLUGIN_NAV_ITEMS: PluginNavItem[] = PLUGIN_NAV_GROUPS.flatMap((group) => group.items);

export function getPluginNavItem(id: string): PluginNavItem | undefined {
  return PLUGIN_NAV_ITEMS.find((item) => item.id === id);
}

export function playgroundPath(id: string): string {
  return `/playground/${id}/`;
}

export function pluginDocsPath(id: string): string {
  return `/plugins/${id}/`;
}
