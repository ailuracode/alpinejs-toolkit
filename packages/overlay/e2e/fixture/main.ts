import overlayPlugin from "@ailuracode/alpine-overlay";
import Alpine from "alpinejs";

Alpine.plugin(overlayPlugin({ root: "#overlay-root", baseZIndex: 1000 }));
Alpine.start();
