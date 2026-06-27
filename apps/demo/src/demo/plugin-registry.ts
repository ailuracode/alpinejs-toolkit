import {
  defineHybridPlugin,
  defineMagicPlugin,
  defineStorePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpinejs-core";
import queryDevtools from "@ailuracode/alpinejs-query-devtools";
import screen from "@ailuracode/alpinejs-screen";
import scroll from "@ailuracode/alpinejs-scroll";
import sidebar from "@ailuracode/alpinejs-sidebar";
import theme from "@ailuracode/alpinejs-theme";
import toast, { toastPositions, toastVariants } from "@ailuracode/alpinejs-toast";
import type { AlpineInstance } from "../types/alpine.js";
import { registerCalendarDemo } from "./calendar-demo.js";
import { registerDemoShell, registerToastDemoHandlers } from "./demo-shell.js";
import { jsonApiDemoOptions, registerJsonApiDemo } from "./json-api-demo.js";
import { registerQueryAdvancedDemo, registerQueryDemos } from "./query-demos.js";
import { registerToastSonner } from "./sonner-demo.js";
import { registerToggleDemos } from "./toggle-demos.js";

export const toastDemoVariants = toastVariants([
  "success",
  "info",
  "warning",
  "error",
  "loading",
] as const);

export const toastDemoPositions = toastPositions(["top-center", "bottom-right"] as const);

export type ToastDemoContent =
  | { kind: "badge"; label: string; seats?: number }
  | { kind: "undo-demo" };

const screenIntervals = [
  { name: "mobile", maxWidth: 767 },
  { name: "tablet", maxWidth: 900 },
  { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
] as const;

function applyTheme({ resolved }: { resolved: "light" | "dark" }) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

let pluginsRegistered = false;

/** Register all demo plugins with @ailuracode/alpinejs-core (no Alpine side effects yet). */
export function registerDemoPlugins(): void {
  if (pluginsRegistered) {
    return;
  }

  pluginsRegistered = true;

  // Essentials — eager sync loaders (shell needs these immediately)
  registerPlugin("theme", defineStorePlugin(["theme"], theme({ onChange: applyTheme })));

  registerPlugin("screen", defineStorePlugin(["device"], screen({ intervals: screenIntervals })));

  registerPlugin("scroll", defineStorePlugin(["scroll"], scroll()));

  registerPlugin(
    "sidebar",
    defineHybridPlugin({
      stores: ["sidebar"],
      magics: ["sidebar"],
      plugin: (Alpine) => {
        sidebar({
          onOpen() {
            document.documentElement.setAttribute("data-sidebar", "");
            document.documentElement.style.scrollbarGutter = "stable";
            (Alpine.store("scroll") as { lock(): void }).lock();
          },
          onClose() {
            document.documentElement.removeAttribute("data-sidebar");
            document.documentElement.style.scrollbarGutter = "";
            (Alpine.store("scroll") as { unlock(): void }).unlock();
          },
          onCollapse() {
            document.documentElement.setAttribute("data-sidebar-collapsed", "");
          },
          onExpand() {
            document.documentElement.removeAttribute("data-sidebar-collapsed");
          },
        })(Alpine);
      },
    })
  );

  registerPlugin(
    "toast",
    defineHybridPlugin({
      stores: ["toast"],
      magics: ["toast"],
      plugin: (Alpine) => {
        const registerToast = toast({
          variants: toastDemoVariants,
          positions: toastDemoPositions,
          promise: {
            loadingVariant: "loading",
            successVariant: "success",
            errorVariant: "error",
          },
          maxToasts: 5,
          maxVisible: 3,
        });

        registerToast?.(Alpine);
      },
    })
  );

  // Extended — lazy dynamic imports
  registerPlugin(
    "network",
    lazyPlugin({
      kind: "magic",
      magics: ["network"],
      import: () => import("@ailuracode/alpinejs-network"),
    })
  );

  registerPlugin(
    "visibility",
    lazyPlugin({
      kind: "magic",
      magics: ["visibility"],
      import: () => import("@ailuracode/alpinejs-visibility"),
    })
  );

  registerPlugin(
    "clipboard",
    lazyPlugin({
      kind: "magic",
      magics: ["clipboard"],
      import: () => import("@ailuracode/alpinejs-clipboard"),
    })
  );

  registerPlugin(
    "platform",
    lazyPlugin({
      kind: "magic",
      magics: ["platform"],
      import: () => import("@ailuracode/alpinejs-platform"),
    })
  );

  registerPlugin(
    "touch",
    lazyPlugin({
      kind: "magic",
      magics: ["touch"],
      import: () => import("@ailuracode/alpinejs-touch"),
    })
  );

  registerPlugin(
    "toggle",
    lazyPlugin({
      kind: "magic",
      magics: ["toggle"],
      import: () => import("@ailuracode/alpinejs-toggle"),
    })
  );

  // Advanced — lazy dynamic imports
  registerPlugin(
    "share",
    lazyPlugin({
      kind: "magic",
      magics: ["share"],
      import: () => import("@ailuracode/alpinejs-share"),
    })
  );

  registerPlugin(
    "battery",
    lazyPlugin({
      kind: "magic",
      magics: ["battery"],
      import: () => import("@ailuracode/alpinejs-battery"),
    })
  );

  registerPlugin(
    "calendar",
    lazyPlugin({
      kind: "magic",
      magics: ["calendar"],
      import: () => import("@ailuracode/alpinejs-calendar"),
    })
  );

  registerPlugin(
    "attention",
    lazyPlugin({
      kind: "both",
      magics: ["wakelock", "idle"],
      import: () => import("@ailuracode/alpinejs-attention"),
    })
  );

  registerPlugin(
    "export",
    lazyPlugin({
      kind: "magic",
      magics: ["export"],
      import: () => import("@ailuracode/alpinejs-export"),
    })
  );

  registerPlugin(
    "geo",
    lazyPlugin({
      kind: "both",
      stores: ["geo"],
      magics: ["geo"],
      import: () => import("@ailuracode/alpinejs-geo"),
    })
  );

  registerPlugin(
    "notify",
    lazyPlugin({
      kind: "magic",
      magics: ["notify"],
      import: () => import("@ailuracode/alpinejs-notify"),
    })
  );

  registerPlugin(
    "nanostores",
    lazyPlugin({
      kind: "magic",
      magics: ["nano"],
      import: async () => {
        const { NanoStores } = await import("@ailuracode/alpinejs-query-adapter-nanostores");
        return { default: NanoStores };
      },
    })
  );

  registerPlugin(
    "query",
    defineStorePlugin(["query"], async () => {
      const [{ default: query }, { createAlpineNanostoresAdapter }] = await Promise.all([
        import("@ailuracode/alpinejs-query"),
        import("@ailuracode/alpinejs-query-adapter-nanostores"),
      ]);

      return query({ adapter: createAlpineNanostoresAdapter });
    })
  );

  registerPlugin(
    "json-api",
    defineMagicPlugin(["jsonapi"], async () => {
      const { default: jsonApi } = await import("@ailuracode/alpinejs-json-api");
      return jsonApi(jsonApiDemoOptions);
    })
  );
}

/** Demo-specific Alpine.data handlers and devtools — run after initPlugins(). */
export function setupDemoExtensions(Alpine: AlpineInstance): void {
  const queryDemoStores = registerQueryDemos(Alpine);
  registerQueryAdvancedDemo(Alpine);
  registerJsonApiDemo(Alpine);
  registerToggleDemos(Alpine);
  registerCalendarDemo(Alpine);
  registerDemoShell(Alpine);
  registerToastDemoHandlers(Alpine);
  registerToastSonner(Alpine);

  Alpine.plugin(
    queryDevtools({
      position: "bottom",
      toggleCorner: "bottom-left",
      additionalStores: queryDemoStores,
    })
  );
}
