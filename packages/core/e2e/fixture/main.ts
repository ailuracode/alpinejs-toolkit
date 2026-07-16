import { dispatchPluginEvent } from "@ailuracode/alpine-core/events";
import { definePlugin, initPluginsSync, registerPlugin } from "@ailuracode/alpine-plugin-registry";
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
  dispatchToggleNoBubble(target: HTMLElement): void {
    dispatchPluginEvent(
      target,
      "toggle",
      "change",
      { previous: false, current: true, source: "toggle" },
      { bubbles: false }
    );
  },
}));

Alpine.data("cancelableDemo", () => ({
  closeResult: "",
  handleBeforeClose(event: Event): void {
    event.preventDefault();
  },
  tryClose(root: HTMLElement): void {
    const event = dispatchPluginEvent(
      root,
      "dialog",
      "before-close",
      { reason: "escape" },
      { cancelable: true }
    );
    this.closeResult = event.defaultPrevented ? "blocked" : "allowed";
  },
}));

initPluginsSync(Alpine, ["theme"]);
Alpine.start();
