/**
 * Alpine.js integration for `@ailuracode/alpine-lang`.
 *
 * Thin adapter that wires {@link LangController} into `$store.lang`
 * and the `$lang` magic. Every command forwards to the controller
 * (see `AGENTS.md` for the integration contract).
 */

import { bindControllerStore } from "@ailuracode/alpine-core/alpine";
import type { Alpine } from "alpinejs";
import type { LangController } from "./controller";
import { createLang } from "./controller";
import type {
  LangAlpine,
  LangChangeDetail,
  LangPluginCallback,
  LangPluginOptions,
  LangStore,
} from "./types";

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
    const Alpine = alpine as unknown as LangAlpine;
    const manager = createLang(options);

    bindControllerStore<LangStore, LangChangeDetail>({
      alpine: Alpine,
      storeKey: LANG_STORE_KEY,
      store: createLangStore(manager),
      controller: manager,
      sync: (reactiveStore, detail) => {
        reactiveStore.current = detail.current;
        reactiveStore.base = detail.base;
        reactiveStore.region = detail.region;
        reactiveStore.languages = [...detail.languages];
        reactiveStore.isDetected = detail.isDetected;
      },
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
