import accordion from "@ailuracode/alpine-accordion";
import attention from "@ailuracode/alpine-attention";
import calendar from "@ailuracode/alpine-calendar";
import carousel from "@ailuracode/alpine-carousel";
import { childPlugin as child } from "@ailuracode/alpine-child";
import command from "@ailuracode/alpine-command";
import { definePlugin, registerPlugin } from "@ailuracode/alpine-core";
import dialog from "@ailuracode/alpine-dialog";
import env from "@ailuracode/alpine-env";
import geo from "@ailuracode/alpine-geo";
import jsonApi from "@ailuracode/alpine-json-api";
import { langPlugin as lang } from "@ailuracode/alpine-lang";
import { mediaPlugin } from "@ailuracode/alpine-media";
import menu from "@ailuracode/alpine-menu";
import notify from "@ailuracode/alpine-notify";
import query from "@ailuracode/alpine-query";
import {
  createAlpineNanostoresAdapter,
  NanoStores,
  queryDevtoolsPlugin,
  default as queryKit,
} from "@ailuracode/alpine-query-kit";
import { scrollPlugin } from "@ailuracode/alpine-scroll";
import { sidebarPlugin } from "@ailuracode/alpine-sidebar";
import tabs from "@ailuracode/alpine-tabs";
import { themePlugin } from "@ailuracode/alpine-theme";
import toast, { toastPositions, toastVariants } from "@ailuracode/alpine-toast";
import { togglePlugin } from "@ailuracode/alpine-toggle";
import tooltip from "@ailuracode/alpine-tooltip";
import transfer from "@ailuracode/alpine-transfer";
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

function scrollLockHandler(Alpine: AlpineInstance) {
  let handle: string | null = null;
  return (locked: boolean) => {
    const scroll = Alpine.store("scroll") as {
      lock(reason?: string): string;
      unlock(handle: string): void;
    };
    if (locked && !handle) {
      handle = scroll.lock("demo-handler");
    } else if (!locked && handle) {
      scroll.unlock(handle);
      handle = null;
    }
  };
}

let pluginsRegistered = false;

/** Register all demo plugins with @ailuracode/alpine-core (no Alpine side effects yet). */
export function registerDemoPlugins(): void {
  if (pluginsRegistered) {
    return;
  }

  registerPlugin(
    "toast",
    definePlugin(["store", "magic"], {
      names: { store: ["toast"], magic: ["toast"] },
      allowNameCrossKind: true,
      plugin: (Alpine) => {
        toast({
          variants: toastDemoVariants,
          positions: toastDemoPositions,
          promise: {
            loadingVariant: "loading",
            successVariant: "success",
            errorVariant: "error",
          },
          maxToasts: 5,
          maxVisible: 3,
        })?.(Alpine);
      },
    })
  );

  // Extended — eager imports (no dynamic code splitting)
  registerPlugin(
    "env",
    definePlugin(["magic"], {
      names: ["network", "visibility", "battery", "platform"],
      plugin: env(),
    })
  );

  registerPlugin(
    "transfer",
    definePlugin(["magic"], {
      names: ["clipboard", "share", "export"],
      plugin: transfer(),
    })
  );

  registerPlugin(
    "child",
    definePlugin(["directive"], {
      names: ["child"],
      plugin: child(),
    })
  );

  // INSERTION-ORDER INVARIANT — overlay-plugin/design §9.
  // `overlayPlugin()` MUST register before any plugin whose templates
  // use `x-teleport="#overlay-root"` (dialog, menu, tooltip, command).
  // The overlay plugin calls `configure()` synchronously on registration,
  // which eagerly appends `<div id="overlay-root">` to `document.body`.
  // Without this, `x-teleport="#overlay-root"` silently no-ops and Alpine
  // logs "Unable to find element with selector #overlay-root".
  registerPlugin(
    "overlay",
    defineHybridPlugin({
      stores: ["overlay"],
      magics: ["overlay"],
      plugin: overlayPlugin(),
    })
  );

  // INSERTION-ORDER INVARIANT — overlay-plugin/design §9.
  // `overlayPlugin()` MUST register before any plugin whose templates
  // use `x-teleport="#overlay-root"` (dialog, menu, tooltip, command).
  // The overlay plugin calls `configure()` synchronously on registration,
  // which eagerly appends `<div id="overlay-root">` to `document.body`.
  // Without this, `x-teleport="#overlay-root"` silently no-ops and Alpine
  // logs "Unable to find element with selector #overlay-root".
  registerPlugin(
    "overlay",
    defineHybridPlugin({
      stores: ["overlay"],
      magics: ["overlay"],
      plugin: overlayPlugin(),
    })
  );

  registerPlugin(
    "dialog",
    definePlugin(["store", "magic"], {
      names: { store: ["dialog"], magic: ["dialog"] },
      allowNameCrossKind: true,
      plugin: (Alpine) => {
        dialog({ onLockChange: scrollLockHandler(Alpine) })(Alpine);
      },
    })
  );

  registerPlugin(
    "menu",
    definePlugin(["store", "magic"], {
      names: { store: ["menu"], magic: ["menu"] },
      allowNameCrossKind: true,
      plugin: (Alpine) => {
        menu({ onLockChange: scrollLockHandler(Alpine) })(Alpine);
      },
    })
  );

  registerPlugin(
    "tooltip",
    definePlugin(["store", "magic"], {
      names: { store: ["tooltip"], magic: ["tooltip"] },
      allowNameCrossKind: true,
      plugin: tooltip(),
    })
  );

  registerPlugin(
    "tabs",
    definePlugin(["store", "magic"], {
      names: { store: ["tabs"], magic: ["tabs"] },
      allowNameCrossKind: true,
      plugin: tabs(),
    })
  );

  registerPlugin(
    "accordion",
    definePlugin(["store", "magic"], {
      names: { store: ["accordion"], magic: ["accordion"] },
      allowNameCrossKind: true,
      plugin: accordion(),
    })
  );

  registerPlugin(
    "command",
    definePlugin(["store", "magic"], {
      names: { store: ["command"], magic: ["command"] },
      allowNameCrossKind: true,
      plugin: command(),
    })
  );

  registerPlugin(
    "carousel",
    definePlugin(["store", "magic"], {
      names: { store: ["carousel"], magic: ["carousel"] },
      allowNameCrossKind: true,
      plugin: carousel(),
    })
  );

  registerPlugin(
    "calendar",
    definePlugin(["magic"], {
      names: ["calendar"],
      plugin: calendar,
    })
  );

  registerPlugin(
    "attention",
    definePlugin(["magic"], {
      names: ["wakelock", "idle"],
      plugin: attention,
    })
  );

  registerPlugin(
    "geo",
    definePlugin(["store", "magic"], {
      names: { store: ["geo"], magic: ["geo"] },
      allowNameCrossKind: true,
      plugin: geo,
    })
  );

  registerPlugin(
    "lang",
    definePlugin(["store", "magic"], {
      names: { store: ["lang"], magic: ["lang"] },
      allowNameCrossKind: true,
      plugin: lang(),
    })
  );

  registerPlugin(
    "notify",
    definePlugin(["magic"], {
      names: ["notify"],
      plugin: (Alpine) => {
        notify()?.(Alpine);
      },
    })
  );

  registerPlugin(
    "nanostores",
    definePlugin(["magic"], {
      names: ["nano"],
      plugin: NanoStores,
    })
  );

  registerPlugin(
    "query",
    definePlugin(["store"], {
      names: ["query"],
      plugin: query({ adapter: createAlpineNanostoresAdapter }),
    })
  );

  registerPlugin(
    "query-kit",
    definePlugin(["store"], {
      names: ["query"],
      plugin: queryKit,
    })
  );

  registerPlugin(
    "json-api",
    definePlugin(["magic"], {
      names: ["jsonapi"],
      plugin: jsonApi(jsonApiDemoOptions),
    })
  );

  pluginsRegistered = true;
}

/** Demo-specific Alpine.data handlers and devtools — run after initPlugins(). */
export function setupDemoExtensions(Alpine: AlpineInstance): void {
  Alpine.plugin([
    togglePlugin(),
    themePlugin(),
    mediaPlugin({ intervals: mediaIntervals }),
    scrollPlugin({
      id: "scroll",
      respectReducedMotion: true,
      reserveScrollbarGap: true,
      target: document.body,
    }),
  ]);

  Alpine.plugin(
    sidebarPlugin({
      closeOnEscape: true,
      breakpoint: {
        query: "(max-width: 1023px)",
        onMismatch: "hide",
      },
      scroll: Alpine.store("scroll"),
    }),
  );

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
