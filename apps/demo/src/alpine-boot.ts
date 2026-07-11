import accordion from "@ailuracode/alpine-accordion";
import attention, { createIdlePermissionAdapter } from "@ailuracode/alpine-attention";
import calendar from "@ailuracode/alpine-calendar";
import carousel from "@ailuracode/alpine-carousel";
import child from "@ailuracode/alpine-child";
import command from "@ailuracode/alpine-command";
import dialog from "@ailuracode/alpine-dialog";
import env from "@ailuracode/alpine-env";
import geo, { createGeoPermissionAdapter } from "@ailuracode/alpine-geo";
import jsonApi from "@ailuracode/alpine-json-api";
import lang from "@ailuracode/alpine-lang";
import media from "@ailuracode/alpine-media";
import menu from "@ailuracode/alpine-menu";
import notify, { createNotificationPermissionAdapter } from "@ailuracode/alpine-notify";
import overlay from "@ailuracode/alpine-overlay";
import permissions from "@ailuracode/alpine-permissions";
import query from "@ailuracode/alpine-query-adapter-alpine";
import queryKit, { createAlpineNanostoresAdapter, NanoStores } from "@ailuracode/alpine-query-kit";
import scroll from "@ailuracode/alpine-scroll";
import sidebar from "@ailuracode/alpine-sidebar";
import tabs from "@ailuracode/alpine-tabs";
import theme from "@ailuracode/alpine-theme";
import toast, { toastPositions, toastVariants } from "@ailuracode/alpine-toast";
import toggle from "@ailuracode/alpine-toggle";
import tooltip from "@ailuracode/alpine-tooltip";
import transfer from "@ailuracode/alpine-transfer";
import anchor from "@alpinejs/anchor";
import collapse from "@alpinejs/collapse";
import morph from "@alpinejs/morph";
import persist from "@alpinejs/persist";
import alpine from "alpinejs";
import { registerDemoDataModules } from "./demo/demo-data-registration.js";
import { jsonApiDemoOptions } from "./demo/json-api-demo.js";

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

export async function startAlpineDemo(): Promise<void> {
  if (window.Alpine) {
    return;
  }

  alpine.plugin([persist, anchor, collapse, morph]);

  alpine.plugin([
    permissions({
      adapters: [
        createNotificationPermissionAdapter(),
        createGeoPermissionAdapter(),
        createIdlePermissionAdapter(),
      ],
    }),
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
    tooltip(),
    tabs(),
    accordion(),
    command(),
    carousel(),
    calendar,
    attention,
    geo(),
    notify(),
    NanoStores,
    query({ adapter: createAlpineNanostoresAdapter }),
    queryKit(),
    jsonApi(jsonApiDemoOptions),
    toggle(),
    theme(),
    media({ intervals: mediaIntervals }),
    scroll({
      id: "scroll",
      respectReducedMotion: true,
      reserveScrollbarGap: true,
      target: document.body,
    }),
    overlay(),
    child(),
    lang(),
  ]);

  const scrollStore = alpine.store("scroll");

  alpine.plugin([
    sidebar({
      closeOnEscape: true,
      breakpoint: {
        query: "(max-width: 1023px)",
        onMismatch: "hide",
      },
      scroll: scrollStore,
    }),
    dialog({ scroll: scrollStore }),
    menu({ scroll: scrollStore }),
  ]);

  await document.fonts.ready;
  registerDemoDataModules(alpine);
  window.Alpine = alpine;
  alpine.start();
}
