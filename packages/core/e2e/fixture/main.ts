import {
  definePlugin,
  dispatchPluginEvent,
  initPluginsSync,
  registerPlugin,
} from "@ailuracode/alpine-core";
import themePlugin from "@ailuracode/alpine-theme";
import Alpine from "alpinejs";

registerPlugin(
  "theme",
  definePlugin(["store"], {
    names: ["theme"],
    plugin: themePlugin({
      defaultTheme: "light",
      strategy: "class",
      darkClass: "theme-dark",
      lightClass: "theme-light",
    }),
  })
);

Alpine.data("pluginEventDemo", () => ({
  toggleDetail: null as { current: boolean } | null,
  themeDetail: null as { current: string } | null,
  dispatchToggle(target: HTMLElement): void {
    dispatchPluginEvent(target, "toggle", "change", {
      previous: false,
      current: true,
      source: "toggle",
    });
  },
  dispatchTheme(): void {
    dispatchPluginEvent(window, "theme", "change", {
      previous: "light",
      current: "dark",
      source: "api",
    });
  },
}));

initPluginsSync(Alpine, ["theme"]);
Alpine.start();
