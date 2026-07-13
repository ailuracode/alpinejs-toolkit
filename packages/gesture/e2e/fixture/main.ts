import gesture from "@ailuracode/alpine-gesture";
import Alpine from "alpinejs";

Alpine.plugin(gesture({ pinchThreshold: 5 }));

Alpine.start();
