import { initPlugins } from "@ailuracode/alpinejs-core";
import alpine from "alpinejs";
import { registerDemoPlugins, setupDemoExtensions } from "./entrypoint";

export async function startAlpineDemo(): Promise<void> {
  registerDemoPlugins();
  await Promise.all([initPlugins(alpine), document.fonts.ready]);
  setupDemoExtensions(alpine);
  window.Alpine = alpine;
  alpine.start();
}
