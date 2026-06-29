import {
  defineHybridPlugin,
  defineMagicPlugin,
  defineStorePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpine-core";
import media from "@ailuracode/alpine-media";
import queryDevtoolsPlugin from "@ailuracode/alpine-query-kit";
import scroll from "@ailuracode/alpine-scroll";
import sidebar from "@ailuracode/alpine-sidebar";
import theme from "@ailuracode/alpine-theme";
import toast, { toastPositions, toastVariants } from "@ailuracode/alpine-toast";
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

const mediaIntervals = [
  { name: "mobile", maxWidth: 767 },
  { name: "tablet", maxWidth: 900 },
  { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
] as const;

function applyTheme({ resolved }: { resolved: "light" | "dark" }) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

let pluginsRegistered = false;

/** Register all demo plugins with @ailuracode/alpine-core (no Alpine side effects yet). */
export function registerDemoPlugins(): void {
  if (pluginsRegistered) {
    return;
  }

  pluginsRegistered = true;

  // Essentials — eager sync loaders (shell needs these immediately)
  registerPlugin("theme", defineStorePlugin(["theme"], theme({ onChange: applyTheme })));

  registerPlugin("media", defineStorePlugin(["media"], media({ intervals: mediaIntervals })));

  registerPlugin("scroll", defineStorePlugin(["scroll"], scroll()));

  registerPlugin(
    "sidebar",
    defineHybridPlugin({
      stores: ["sidebar"],
      magics: ["sidebar"],
      plugin: (Alpine) => {
        sidebar({
          onShow() {
            document.documentElement.setAttribute("data-sidebar", "");
            document.documentElement.style.scrollbarGutter = "stable";
            (Alpine.store("scroll") as { lock(): void }).lock();
          },
          onHide() {
            document.documentElement.removeAttribute("data-sidebar");
            document.documentElement.style.scrollbarGutter = "";
            (Alpine.store("scroll") as { unlock(): void }).unlock();
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

  registerPlugin(
    "env",
    lazyPlugin({
      kind: "magic",
      magics: ["network", "visibility", "battery", "platform"],
      import: () => import("@ailuracode/alpine-env"),
    })
  );

  registerPlugin(
    "transfer",
    lazyPlugin({
      kind: "magic",
      magics: ["clipboard", "share", "export"],
      import: () => import("@ailuracode/alpine-transfer"),
    })
  );

  // Extended — lazy dynamic imports
  registerPlugin(
    "toggle",
    lazyPlugin({
      kind: "magic",
      magics: ["toggle"],
      import: () => import("@ailuracode/alpine-toggle"),
    })
  );

  // Advanced — lazy dynamic imports
  registerPlugin(
    "calendar",
    lazyPlugin({
      kind: "magic",
      magics: ["calendar"],
      import: () => import("@ailuracode/alpine-calendar"),
    })
  );

  registerPlugin(
    "attention",
    lazyPlugin({
      kind: "magic",
      magics: ["wakelock", "idle"],
      import: () => import("@ailuracode/alpine-attention"),
    })
  );

  registerPlugin(
    "geo",
    lazyPlugin({
      kind: "both",
      stores: ["geo"],
      magics: ["geo"],
      import: () => import("@ailuracode/alpine-geo"),
    })
  );

  registerPlugin(
    "lang",
    lazyPlugin({
      kind: "both",
      stores: ["lang"],
      magics: ["lang"],
      import: () => import("@ailuracode/alpine-lang"),
    })
  );

  registerPlugin(
    "notify",
    lazyPlugin({
      kind: "magic",
      magics: ["notify"],
      import: () => import("@ailuracode/alpine-notify"),
    })
  );

  registerPlugin(
    "nanostores",
    lazyPlugin({
      kind: "magic",
      magics: ["nano"],
      import: async () => {
        const { NanoStores } = await import("@ailuracode/alpine-query-kit");
        return { default: NanoStores };
      },
    })
  );

  registerPlugin(
    "query",
    defineStorePlugin(["query"], async () => {
      const [{ default: query }, { createAlpineNanostoresAdapter }] = await Promise.all([
        import("@ailuracode/alpine-query"),
        import("@ailuracode/alpine-query-kit"),
      ]);

      return query({ adapter: createAlpineNanostoresAdapter });
    })
  );

  registerPlugin(
    "query-kit",
    defineStorePlugin(["query"], async () => {
      const { default: queryKit } = await import("@ailuracode/alpine-query-kit");
      return queryKit;
    })
  );

  registerPlugin(
    "json-api",
    defineMagicPlugin(["jsonapi"], async () => {
      const { default: jsonApi } = await import("@ailuracode/alpine-json-api");
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
    queryDevtoolsPlugin({
      position: "bottom",
      toggleCorner: "bottom-left",
      additionalStores: queryDemoStores,
    })
  );
}
