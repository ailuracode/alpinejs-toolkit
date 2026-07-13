import themePlugin from "@ailuracode/alpine-theme";
import Alpine from "alpinejs";

Alpine.plugin(
  themePlugin({
    defaultTheme: "light",
    strategy: "class",
    darkClass: "theme-dark",
    lightClass: "theme-light",
  })
);

Alpine.start();
