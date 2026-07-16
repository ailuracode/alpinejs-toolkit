/**
 * Public type contracts for `@ailuracode/alpine-lang`.
 *
 * Per `.cursor/rules/formatting.mdc`, every public type
 * lives in a `types.ts` module so consumers can import them without
 * pulling the implementation. The shape IS the contract — changes
 * to a field name or type are breaking changes.
 */

import type { Alpine, PluginCallback, SingletonScope, Unsubscribe } from "@ailuracode/alpine-core";
import type { Alpine as AlpineBase } from "alpinejs";

/** Re-exported so consumers can grab every lang type from one path. */
export type { Unsubscribe };

/** Default fallback applied when `navigator.language` is unavailable. */
export const DEFAULT_LANG_FALLBACK: string = "en";

/**
 * Source of a language change. Single source of truth for the
 * `change` event's `source` field; adding a new member ripples
 * through every consumer so exhaustiveness is enforced by
 * TypeScript. Public: branching on `detail.source` is a contract.
 */
export type LangChangeSource = "initialization" | "user" | "reset";

/**
 * Structured snapshot of every observable language field.
 *
 * - `current` is the normalized full tag (e.g. `"es-ec"`).
 * - `base` is the language subtag without region (`"es"`).
 * - `region` is the region subtag (`"ec"`) or `null`.
 * - `languages` mirrors `navigator.languages`, normalized.
 * - `fallback` is the configured fallback (post-normalization).
 * - `isDetected` is `true` when the initial value came from `navigator`.
 */
export interface LangState {
  readonly current: string;
  readonly base: string;
  readonly region: string | null;
  readonly languages: readonly string[];
  readonly fallback: string;
  readonly isDetected: boolean;
}

/**
 * Payload delivered to subscribers on every relevant transition.
 * Extends {@link LangState} so consumers always receive the full
 * snapshot alongside the `source` discriminator and the previous
 * snapshot (`null` only on the very first emit).
 */
export interface LangChangeDetail extends LangState {
  /** Why the change happened. */
  readonly source: LangChangeSource;
  /** Previous snapshot — `null` only on the initialization event. */
  readonly previous: LangState | null;
}

/** Options accepted by {@link createLang}. */
export interface CreateLangOptions {
  /**
   * Stable identifier exposed via {@link LangController.id}. When
   * omitted, the controller generates one from the class name.
   * Tests typically pin this for deterministic assertions.
   */
  readonly id?: string;
  /**
   * Fallback language used when neither `navigator.language` nor
   * `navigator.languages` is available. Default:
   * {@link DEFAULT_LANG_FALLBACK} (`"en"`).
   */
  readonly fallback?: string;
  /**
   * Lower-case the language tag and convert underscores to dashes
   * (`pt_BR` → `pt-br`). Default: `true`.
   */
  readonly normalize?: boolean;
  /**
   * Optional `navigator`-like reader. When provided, the controller
   * bypasses the global `navigator` and reads `language` /
   * `languages` from this object. Mainly intended for tests and
   * SSR adapters — production code can ignore the option.
   */
  readonly navigator?: NavigatorLike | null;
  /**
   * Singleton scope for this controller. Defaults to the active
   * `document`, an ambient `runWithSingletonScope()` context, or —
   * in SSR — must be provided explicitly as a plain object.
   */
  readonly scope?: SingletonScope;
}

/**
 * Minimal `Navigator` surface the controller reads. Mirrors the
 * parts of the DOM `Navigator` interface used by the plugin so a
 * custom reader can be injected for testing or server adapters.
 */
export interface NavigatorLike {
  readonly language?: string | undefined;
  readonly languages?: readonly string[] | undefined;
}

/**
 * Public, framework-agnostic manager returned by {@link createLang}.
 *
 * Reads flow through getters so consumers see live values; mutations
 * go through the manager so subscriptions and the in-place snapshot
 * stay consistent.
 */
export interface LangManager {
  /** Normalized full language tag. */
  readonly current: string;
  /** Base subtag of the current language. */
  readonly base: string;
  /** Region subtag, `null` when none. */
  readonly region: string | null;
  /** Snapshot of `navigator.languages` (normalized). */
  readonly languages: readonly string[];
  /** Effective fallback in use. */
  readonly fallback: string;
  /** `true` when the initial value came from `navigator`. */
  readonly isDetected: boolean;
  /** Read-only snapshot of the manager's state. */
  get(): LangState;
  /** Match the current language exactly or by base subtag. */
  is(value: string): boolean;
  /** Match any tag in `navigator.languages` by exact tag or base subtag. */
  includes(value: string): boolean;
  /**
   * Sets the current language. No-op when the value is empty or
   * unchanged, and emits a `change` event only when the value
   * actually transitions.
   */
  set(language: string): void;
  /** Re-detects from `navigator.language` / `navigator.languages`. */
  reset(): void;
  /**
   * Subscribes to a `change` event. Returns an unsubscribe function.
   * The detail payload carries `LangState` plus `source` and
   * `previous` (`null` on initialization).
   */
  on(event: "change", listener: (detail: LangChangeDetail) => void): Unsubscribe;
  /** Tears down listeners and releases references. Idempotent. */
  destroy(): void;
}

/**
 * Typed view of `Alpine` the lang plugin uses internally.
 *
 * Built from the toolkit's {@link Alpine} generic with the `lang`
 * store / magic mapped to its concrete {@link LangStore} shape. A
 * real `Alpine` runtime is assignable to `LangAlpine` without a cast
 * because the toolkit's `Alpine<Stores>` only adds overloads.
 *
 * The optional `cleanup?` member mirrors theme's integration so
 * `manager.destroy()` can be forwarded through Alpine's lifecycle.
 */
export type LangAlpine = Alpine<{ lang: LangStore }> & {
  /** Forwarded through Alpine's cleanup mechanism when available. */
  cleanup?(callback: () => void): void;
};

/** Alpine-facing store surface. The integration fills it from a manager. */
export interface LangStore {
  current: string;
  base: string;
  region: string | null;
  languages: readonly string[];
  readonly fallback: string;
  isDetected: boolean;
  is(value: string): boolean;
  includes(value: string): boolean;
  set(language: string): void;
  reset(): void;
}

/**
 * Options accepted by {@link langPlugin}.
 *
 * Kept as a separate type from {@link CreateLangOptions} so the plugin
 * only exposes the subset a consumer can configure at registration
 * time. The full {@link CreateLangOptions} stays available for the
 * headless {@link createLang} factory, where advanced options like
 * `navigator` matter.
 */
export interface LangPluginOptions {
  /** Fallback language. Default: `"en"`. */
  readonly fallback?: string;
  /** Lower-case and normalize separators. Default: `true`. */
  readonly normalize?: boolean;
  /**
   * `$store.lang` store key the Alpine plugin registers under.
   * Defaults to {@link DEFAULT_LANG_STORE_KEY}. Set when the host
   * already owns a `lang` store or another toolkit plugin would
   * collide on that name — the rename avoids the collision without
   * touching the controller.
   */
  readonly storeKey?: string;
}

/** Default `$store.lang` key registered by {@link langPlugin}. */
export const DEFAULT_LANG_STORE_KEY = "lang";

/**
 * `Alpine.plugin()` callback signature.
 *
 * Typed against the base {@link AlpineBase} via the toolkit's
 * {@link PluginCallback} generic, which keeps this alias structurally
 * assignable to `Base.PluginCallback`. The plugin narrows the
 * runtime instance to {@link LangAlpine} inside the function body for
 * typed access to the `"lang"` store / magic.
 */
export type LangPluginCallback = PluginCallback<AlpineBase>;
