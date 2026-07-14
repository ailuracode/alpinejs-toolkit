import menuPlugin from "@ailuracode/alpine-menu";
import scrollPlugin from "@ailuracode/alpine-scroll";
import Alpine from "alpinejs";

Alpine.plugin(scrollPlugin({}));
Alpine.plugin(menuPlugin({ exclusive: true }));
Alpine.start();
