import history from "@ailuracode/alpine-history";
import Alpine from "alpinejs";

Alpine.plugin(history({ initialValue: 0, limit: 50 }));
Alpine.start();
