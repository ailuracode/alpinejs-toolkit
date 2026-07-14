import { definePlugin, initPluginsSync, registerPlugin } from "@ailuracode/alpine-core";
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

initPluginsSync(Alpine, ["theme"]);
Alpine.start();
