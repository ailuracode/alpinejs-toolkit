import { initPlugins } from "@ailuracode/alpine-core";
import anchor from "@alpinejs/anchor";
import collapse from "@alpinejs/collapse";
import morph from "@alpinejs/morph";
import persist from "@alpinejs/persist";
import alpine from "alpinejs";
import { registerDemoPlugins, setupDemoExtensions } from "./entrypoint";

export async function startAlpineDemo(): Promise<void> {
  alpine.plugin(persist);
  alpine.plugin(anchor);
  alpine.plugin(collapse);
  alpine.plugin(morph);
  registerDemoPlugins();
  await Promise.all([initPlugins(alpine), document.fonts.ready]);
  setupDemoExtensions(alpine);
  window.Alpine = alpine;
  alpine.start();
}
