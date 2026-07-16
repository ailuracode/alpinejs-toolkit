/**
 * Alpine.js integration for `@ailuracode/alpine-lang`.
 *
 * Thin adapter that wires {@link LangController} into `$store.lang`
 * and the `$lang` magic. Every command forwards to the controller
 * (see `AGENTS.md` for the integration contract).
 */

import { bridgeControllerStore } from "@ailuracode/alpine-core/bridge";
import type { Alpine } from "alpinejs";
import type { LangController } from "./controller";
import { createLang } from "./controller";
import type { LangAlpine, LangPluginCallback, LangPluginOptions, LangStore } from "./types";
import { DEFAULT_LANG_STORE_KEY } from "./types";

/**
 * Plugin factory — returns the `Alpine.plugin()` callback. Pass
 * {@link LangPluginOptions} to configure {@link LangController},
 * or `{}` for the package defaults. See `AGENTS.md` for the
 * integration contract.
 *
 * `onChange` (registration-time callback) was retired in this
 * release: consumers should subscribe via `createLang().on("change", ...)`
 * or via the reactive `$store.lang` directly. The breaking change
 * is documented in the `lang-architecture-2026-07` changeset.
 */
export function langPlugin(options: LangPluginOptions = {}): LangPluginCallback {
  const storeKey = options.storeKey ?? DEFAULT_LANG_STORE_KEY;

  return function registerLang(alpine: Alpine): void {
    // Narrow the base `Alpine` runtime to the toolkit's typed view.
    // The boundary cast is the only `as unknown as` in this file —
    // every subsequent call is fully typed against `LangAlpine`.
    const Alpine = alpine as unknown as LangAlpine;
    // `createLang()` already mounts; the controller's constructor
    // seeds deterministic state and `mount()` performs browser
    // detection when no navigator is injected.
    const manager = createLang(options);
    const store = createLangStore(manager);

    bridgeControllerStore<LangStore, LangController>({
      alpine: Alpine,
      storeKey,
      store,
      controller: manager,
      packageName: "lang",
      subscribe: (reactiveStore) =>
        manager.on("change", (detail) => {
          reactiveStore.current = detail.current;
          reactiveStore.base = detail.base;
          reactiveStore.region = detail.region;
          reactiveStore.languages = [...detail.languages];
          reactiveStore.isDetected = detail.isDetected;
        }),
    });
  };
}

/**
 * Builds the {@link LangStore} Alpine exposes through `$store.lang`.
 * The store's reads delegate to the manager; mutations go through
 * the manager's semantic commands.
 *
 * Inline construction (no `as LangStore` cast, no seed/bind helpers)
 * because the six observable fields plus the four commands are
 * enough to exhaustively describe the object. Splitting helpers
 * would add indirection without buying anything.
 *
 * Standalone consumers (non-Alpine) can subscribe themselves and
 * forward updates the same way the adapter does.
 */
export function createLangStore(manager: LangController): LangStore {
  return {
    current: manager.current,
    base: manager.base,
    region: manager.region,
    languages: manager.languages,
    fallback: manager.fallback,
    isDetected: manager.isDetected,
    is: (value) => manager.is(value),
    includes: (value) => manager.includes(value),
    set: (language) => {
      manager.set(language);
    },
    reset: () => {
      manager.reset();
    },
  };
}
