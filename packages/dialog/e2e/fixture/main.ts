import dialogPlugin from "@ailuracode/alpine-dialog";
import scrollPlugin from "@ailuracode/alpine-scroll";
import Alpine from "alpinejs";

Alpine.plugin(scrollPlugin({}));
Alpine.plugin(dialogPlugin({ closeOnEscape: true }));
Alpine.start();
