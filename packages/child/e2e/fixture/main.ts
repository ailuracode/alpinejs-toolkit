import childPlugin from "@ailuracode/alpine-child";
import morph from "@alpinejs/morph";
import Alpine from "alpinejs";

Alpine.plugin(morph);
Alpine.plugin(childPlugin());
Alpine.start();
