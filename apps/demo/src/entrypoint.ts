import attention from "@ailuracode/alpine-attention";
import battery from "@ailuracode/alpine-battery";
import calendar from "@ailuracode/alpine-calendar";
import clipboard from "@ailuracode/alpine-clipboard";
import exportPlugin from "@ailuracode/alpine-export";
import geo from "@ailuracode/alpine-geo";
import jsonApi from "@ailuracode/alpine-json-api";
import network from "@ailuracode/alpine-network";
import notify from "@ailuracode/alpine-notify";
import platform from "@ailuracode/alpine-platform";
import query from "@ailuracode/alpine-query";
import {
  createAlpineNanostoresAdapter,
  NanoStores,
} from "@ailuracode/alpine-query-adapter-nanostores";
import queryDevtools from "@ailuracode/alpine-query-devtools";
import screen from "@ailuracode/alpine-screen";
import scroll from "@ailuracode/alpine-scroll";
import share from "@ailuracode/alpine-share";
import sidebar from "@ailuracode/alpine-sidebar";
import theme from "@ailuracode/alpine-theme";
import toast, { toastPositions, toastVariants } from "@ailuracode/alpine-toast";
import toggle from "@ailuracode/alpine-toggle";
import touch from "@ailuracode/alpine-touch";
import visibility from "@ailuracode/alpine-visibility";
import type { Alpine } from "alpinejs";
import { registerCalendarDemo } from "./demo/calendar-demo.js";
import { registerDemoShell, registerToastDemoHandlers } from "./demo/demo-shell.js";
import { jsonApiDemoOptions, registerJsonApiDemo } from "./demo/json-api-demo.js";
import { registerQueryAdvancedDemo, registerQueryDemos } from "./demo/query-demos.js";
import { registerToastSonner } from "./demo/sonner-demo.js";
import { registerToggleDemos } from "./demo/toggle-demos.js";

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

export default (Alpine: Alpine) => {
  Alpine.plugin(
    theme({
      onChange({ resolved }) {
        document.documentElement.classList.toggle("dark", resolved === "dark");
        document.documentElement.style.colorScheme = resolved;
      },
    })
  );
  const intervals = [
    { name: "mobile", maxWidth: 767 },
    { name: "tablet", maxWidth: 900 },
    { name: "desktop", maxWidth: Number.POSITIVE_INFINITY },
  ] as const;

  Alpine.plugin(screen({ intervals }));
  Alpine.plugin(scroll());
  Alpine.plugin(share);
  Alpine.plugin(
    sidebar({
      onOpen() {
        document.documentElement.setAttribute("data-sidebar", "");
        document.documentElement.style.scrollbarGutter = "stable";
        Alpine.store("scroll").lock();
      },
      onClose() {
        document.documentElement.removeAttribute("data-sidebar");
        document.documentElement.style.scrollbarGutter = "";
        Alpine.store("scroll").unlock();
      },
      onCollapse() {
        document.documentElement.setAttribute("data-sidebar-collapsed", "");
      },
      onExpand() {
        document.documentElement.removeAttribute("data-sidebar-collapsed");
      },
    })
  );
  Alpine.plugin(network);
  Alpine.plugin(visibility);
  Alpine.plugin(battery);
  Alpine.plugin(calendar);
  Alpine.plugin(attention);
  Alpine.plugin(clipboard);
  Alpine.plugin(exportPlugin);
  Alpine.plugin(geo);
  Alpine.plugin(
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
    })
  );
  Alpine.plugin(toggle);
  Alpine.plugin(touch);
  Alpine.plugin(platform);
  Alpine.plugin(NanoStores);
  Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
  Alpine.plugin(jsonApi(jsonApiDemoOptions));
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
  Alpine.plugin(notify);
};
