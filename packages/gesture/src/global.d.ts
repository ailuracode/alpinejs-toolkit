import type { GestureStore } from "./index.js";

declare module "@ailuracode/alpine-core" {
  interface AlpineStores {
    gesture: GestureStore;
  }
  interface AlpineMagics {
    gesture: GestureStore;
  }
}
