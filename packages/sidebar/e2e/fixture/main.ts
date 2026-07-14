import scrollPlugin from "@ailuracode/alpine-scroll";
import sidebarPlugin from "@ailuracode/alpine-sidebar";
import togglePlugin from "@ailuracode/alpine-toggle";
import Alpine from "alpinejs";

Alpine.plugin(togglePlugin());
Alpine.plugin(scrollPlugin({}));
Alpine.plugin(
  sidebarPlugin({
    breakpoint: { query: "(min-width: 768px)", onMismatch: "hide" },
  })
);
Alpine.start();
