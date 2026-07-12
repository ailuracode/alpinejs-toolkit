import { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";
import type { AlpineInstance } from "../types/alpine.js";
import { registerCalendarDemo } from "./calendar-demo.js";
import { registerCommandDemo } from "./command-demo.js";
import { registerDemoShell, registerToastDemoHandlers } from "./demo-shell.js";
import { registerJsonApiDemo } from "./json-api-demo.js";
import { registerQueryAdvancedDemo, registerQueryDemos } from "./query-demos.js";
import { registerSelectionDemo } from "./selection-demo.js";
import { registerToastSonner } from "./sonner-demo.js";
import { registerToggleDemos } from "./toggle-demos.js";

/** Registers Alpine.data demo modules, demo handlers, and demo devtools wiring. */
export function registerDemoDataModules(Alpine: AlpineInstance): void {
  const queryDemoStores = registerQueryDemos(Alpine);
  registerQueryAdvancedDemo(Alpine);
  registerJsonApiDemo(Alpine);
  registerToggleDemos(Alpine);
  registerCalendarDemo(Alpine);
  registerCommandDemo(Alpine);
  registerSelectionDemo(Alpine);
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
