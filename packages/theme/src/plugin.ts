import { bridgeControllerStore, safeDocument } from "@ailuracode/alpine-core";
import type { Alpine } from "alpinejs";
import { createTheme, type ThemeController } from "./controller";
import type { CreateThemeOptions, ThemePluginCallback, ThemeStore } from "./types";

export function themePlugin(options: CreateThemeOptions = {}): ThemePluginCallback {
  const storeKey = options.storeKey ?? "theme";
  const magicKey = options.magicKey ?? options.storeKey ?? "theme";
  const reapplyEvents = options.reapplyEvents;

  return function registerTheme(Alpine: Alpine): void {
    const manager = createTheme(options);
    const store = createThemeStore(manager);

    const ref = safeDocument();
    const teardown: Array<() => void> = [];
    if (ref && reapplyEvents && reapplyEvents.length > 0) {
      const reapply = (): void => manager.apply();
      for (const type of reapplyEvents) {
        ref.addEventListener(type, reapply);
        teardown.push(() => ref.removeEventListener(type, reapply));
      }
    }

    bridgeControllerStore({
      alpine: Alpine,
      storeKey,
      magicKey,
      store,
      controller: manager,
      packageName: "theme",
      subscribe: (reactiveStore) =>
        manager.on("change", (detail) => {
          reactiveStore.current = detail.current;
          reactiveStore.system = detail.system;
          reactiveStore.resolved = detail.resolved;
        }),
      onCleanup: () => {
        for (const fn of teardown) {
          fn();
        }
      },
    });
  };
}

export function createThemeStore(manager: ThemeController): ThemeStore {
  return {
    current: manager.current,
    system: manager.system,
    resolved: manager.resolved,
    set(value) {
      manager.set(value);
    },
    toggle() {
      manager.toggle();
    },
    reset() {
      manager.reset();
    },
    apply() {
      manager.apply();
    },
  };
}
