import type AlpineType from "alpinejs";
import Alpine from "alpinejs";

let alpineStarted = false;

export function startAlpine(...plugins: AlpineType.PluginCallback[]): typeof Alpine {
  for (const plugin of plugins) {
    Alpine.plugin(plugin);
  }

  document.body.innerHTML = "<div x-data x-init></div>";

  if (!alpineStarted) {
    Alpine.start();
    alpineStarted = true;
  }

  return Alpine;
}
