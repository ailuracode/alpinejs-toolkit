import type AlpineType from "alpinejs";
import { registerAttentionMagic } from "./controller.js";

export * from "./controller.js";

/** Alpine.js attention plugin. Registers `$wakelock` and `$idle` magics. */
export default function attentionPlugin(Alpine: AlpineType.Alpine): void {
  registerAttentionMagic(Alpine);
}
