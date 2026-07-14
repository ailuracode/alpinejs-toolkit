import { toastPlugin } from "@ailuracode/alpine-toast";
import Alpine from "alpinejs";

Alpine.plugin(toastPlugin({ defaultDuration: 5000, maxToasts: 5 }));
Alpine.start();
