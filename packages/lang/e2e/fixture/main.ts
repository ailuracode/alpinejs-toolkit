import { langPlugin } from "@ailuracode/alpine-lang";
import Alpine from "alpinejs";

Alpine.plugin(langPlugin({ fallback: "en" }));
Alpine.start();
