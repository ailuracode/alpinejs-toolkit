/**
 * Public entrypoint for `@ailuracode/alpine-lang`.
 *
 * Per `.cursor/rules/new-package.mdc`, this file
 * MUST only contain re-exports. Implementations live under
 * `./controller`, `./plugin`, `./events`, and `./language-tag` so the
 * public surface is easy to audit and the package stays
 * tree-shakeable (each export resolves to a single named binding).
 *
 * Two ways to consume the package:
 *
 * 1. Alpine — `Alpine.plugin(langPlugin({ ... }))` registers the
 *    `$store.lang` store and the `$lang` magic.
 * 2. Standalone — `createLang({ ... })` returns a manager for
 *    custom adapters / tests / non-Alpine apps.
 */

// --- Headless controller --------------------------------------------------
export { createLang, LangController } from "./controller";
// --- Events --------------------------------------------------------------
export type { LangEvents, LangListener } from "./events";
// --- Pure language-tag helpers ------------------------------------------
export { normalizeLanguageTag, parseLanguageTag } from "./language-tag";
// --- Alpine integration --------------------------------------------------
export { createLangStore, langPlugin, langPlugin as default } from "./plugin";

// --- Public types --------------------------------------------------------
export type {
  CreateLangOptions,
  LangAlpine,
  LangChangeDetail,
  LangChangeSource,
  LangManager,
  LangPluginCallback,
  LangPluginOptions,
  LangState,
  LangStore,
  NavigatorLike,
  Unsubscribe,
} from "./types";
export { DEFAULT_LANG_FALLBACK, DEFAULT_LANG_STORE_KEY } from "./types";
