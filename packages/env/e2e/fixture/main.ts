import envPlugin from "@ailuracode/alpine-env";
import Alpine from "alpinejs";

Alpine.plugin(envPlugin({ network: true, visibility: true, battery: false, platform: true }));
Alpine.start();
