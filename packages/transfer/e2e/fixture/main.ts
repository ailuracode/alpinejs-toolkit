import { transferPlugin } from "@ailuracode/alpine-transfer";
import Alpine from "alpinejs";

Alpine.plugin(transferPlugin({ clipboard: true, share: false, export: true }));
Alpine.start();
