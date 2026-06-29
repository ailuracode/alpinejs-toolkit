import { initPlugins } from "@ailuracode/alpine-core";
import persist from "@alpinejs/persist";
import alpine from "alpinejs";
import { registerDemoPlugins, setupDemoExtensions } from "./entrypoint";

export async function startAlpineDemo(): Promise<void> {
  alpine.plugin(persist);
  registerDemoPlugins();
  await Promise.all([initPlugins(alpine), document.fonts.ready]);
  setupDemoExtensions(alpine);
  window.Alpine = alpine;
  alpine.start();
}
