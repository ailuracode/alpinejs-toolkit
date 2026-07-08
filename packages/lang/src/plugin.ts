/**
 * Alpine.js integration for `@ailuracode/alpine-lang`.
 *
 * Thin adapter that wires {@link LangController} into `$store.lang`
 * and the `$lang` magic. Every command forwards to the controller
 * (see `AGENTS.md` for the integration contract).
 */

import type { Alpine } from "alpinejs";
import type { LangController } from "./controller";
import { createLang } from "./controller";
import type { LangAlpine, LangPluginCallback, LangPluginOptions, LangStore } from "./types";

/** Key under which the lang store is registered on `$store`. */
const LANG_STORE_KEY = "lang";

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
  return function registerLang(alpine: Alpine): void {
    // Narrow the base `Alpine` runtime to the toolkit's typed view.
    // The boundary cast is the only `as unknown as` in this file —
    // every subsequent call is fully typed against `LangAlpine`.
    const Alpine = alpine as unknown as LangAlpine;
    // `createLang()` already mounts; the controller's constructor
    // performs eager detection from `navigator`, so by the time we
    // build the store every field has a value to mirror.
    const manager = createLang(options);
    const store = createLangStore(manager);
    Alpine.store(LANG_STORE_KEY, store);
    // Alpine wraps the value in a reactive proxy on registration.
    // Re-target the subscription so mutations land on the proxy, not
    // on the unwrapped original — otherwise `x-text` bindings on the
    // `$lang` magic / `$store.lang` never re-render. We cache the
    // proxy so the `$lang` magic returns the SAME reference instead
    // of forcing Alpine to re-resolve the store on every access.
    const reactiveStore = Alpine.store(LANG_STORE_KEY);
    manager.on("change", (detail) => {
      reactiveStore.current = detail.current;
      reactiveStore.base = detail.base;
      reactiveStore.region = detail.region;
      reactiveStore.languages = [...detail.languages];
      reactiveStore.isDetected = detail.isDetected;
    });
    Alpine.magic(LANG_STORE_KEY, () => reactiveStore);

    // Forward destroy() through Alpine's cleanup mechanism when available.
    if (typeof Alpine.cleanup === "function") {
      Alpine.cleanup(() => manager.destroy());
    }
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
