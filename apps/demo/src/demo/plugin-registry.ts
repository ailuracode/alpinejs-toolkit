import accordion from "@ailuracode/alpine-accordion";
import attention from "@ailuracode/alpine-attention";
import calendar from "@ailuracode/alpine-calendar";
import carousel from "@ailuracode/alpine-carousel";
import { childPlugin as child } from "@ailuracode/alpine-child";
import command from "@ailuracode/alpine-command";
import dialog from "@ailuracode/alpine-dialog";
import env from "@ailuracode/alpine-env";
import geo from "@ailuracode/alpine-geo";
import jsonApi from "@ailuracode/alpine-json-api";
import { langPlugin as lang } from "@ailuracode/alpine-lang";
import { mediaPlugin } from "@ailuracode/alpine-media";
import menu from "@ailuracode/alpine-menu";
import notify from "@ailuracode/alpine-notify";
import { overlayPlugin } from "@ailuracode/alpine-overlay";
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
import { registerCommandDemo } from "./command-demo.js";
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

/** Register all demo plugins directly with `Alpine.plugin(...)`. */
export function registerDemoPlugins(Alpine: AlpineInstance): void {
  if (pluginsRegistered) {
    return;
  }

  Alpine.plugin([
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
    }),
    env(),
    transfer(),
    child(),
    dialog({ onLockChange: scrollLockHandler(Alpine) }),
    menu({ onLockChange: scrollLockHandler(Alpine) }),
    tooltip(),
    tabs(),
    accordion(),
    command(),
    carousel(),
    calendar,
    attention,
    geo,
    lang(),
    notify(),
    NanoStores,
    query({ adapter: createAlpineNanostoresAdapter }),
    queryKit(),
    jsonApi(jsonApiDemoOptions),
  ]);

  pluginsRegistered = true;
}

/** Demo-specific Alpine.data handlers and devtools — run after plugin registration. */
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
    overlayPlugin(),
  ]);

  Alpine.plugin(
    sidebarPlugin({
      closeOnEscape: true,
      breakpoint: {
        query: "(max-width: 1023px)",
        onMismatch: "hide",
      },
      scroll: Alpine.store("scroll"),
    })
  );

  const queryDemoStores = registerQueryDemos(Alpine);
  registerQueryAdvancedDemo(Alpine);
  registerJsonApiDemo(Alpine);
  registerToggleDemos(Alpine);
  registerCalendarDemo(Alpine);
  registerCommandDemo(Alpine);
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
