/**
 * Lang controller — the framework-agnostic core of
 * `@ailuracode/alpine-lang`. Owns every piece of language state
 * (`current` / `base` / `region` / `languages` / `fallback` /
 * `isDetected`) and exposes the `set` / `reset` / `is` /
 * `includes` commands.
 *
 * Responsibilities:
 *
 * 1. **Detection** — read `navigator.language` / `navigator.languages`
 *    eagerly in the constructor (SSR-safe via a `typeof` guard).
 * 2. **Normalization** — lower-case + convert `_` to `-` when the
 *    `normalize` option is enabled (default).
 * 3. **Matching** — `is()` / `includes()` both honor the
 *    normalization flag.
 * 4. **Subscriptions** — typed `on('change', listener)` from the
 *    inherited bus, with the lang-level detail shape
 *    (`LangState` + `source` + `previous`).
 *
 * Construction rules:
 *
 * - The constructor reads `navigator` lazily — when the runtime is
 *   SSR (`navigator` undefined) the constructor falls back to the
 *   configured fallback without throwing.
 * - The factory `createLang()` auto-mounts so callers receive a
 *   fully-initialized instance.
 * - `destroy()` MUST be idempotent.
 */

import {
  BaseController,
  clearSingleton,
  createSingleton,
  generateId,
} from "@ailuracode/alpine-core";
import type { LangEvents } from "./events";
import { normalizeLanguageTag, parseLanguageTag } from "./language-tag";
import type {
  CreateLangOptions,
  LangChangeDetail,
  LangChangeSource,
  LangManager,
  LangState,
  NavigatorLike,
} from "./types";

/**
 * Stable registry key for the singleton lang controller. Tests should
 * call `clearSingleton(LANG_SINGLETON_KEY)` (or `clearAllSingletons()`)
 * to reset between cases. `options.id` identifies the controller
 * instance, but two `createLang()` calls in the same document
 * describe the same logical language registry — the singleton
 * guarantees a single source of truth.
 */
const LANG_SINGLETON_KEY = "@ailuracode/alpine-lang/default";

/**
 * Public entrypoint — builds and mounts a fully-initialized
 * {@link LangController}. The constructor performs eager detection;
 * the factory only adds the auto-mount step.
 *
 * Singleton guarantee: at most one live `LangController` per
 * document. Repeated calls return the existing instance; the
 * controller's `destroy()` releases the slot so the next call
 * builds a fresh one. Direct `new LangController(...)` is still
 * supported for tests and advanced consumers — only the
 * `createLang()` factory enforces uniqueness.
 */
export function createLang(options: CreateLangOptions = {}): LangController {
  return createSingleton(LANG_SINGLETON_KEY, () => {
    const controller = new LangController(options);
    controller.mount();
    return controller;
  });
}

/**
 * Headless controller for `@ailuracode/alpine-lang`. Read every
 * public field through getters; mutate through the commands. The
 * Alpine integration in `plugin.ts` subscribes to the controller's
 * `change` event and mirrors the snapshot into the reactive store
 * so bindings re-render automatically.
 *
 * Standalone consumers (non-Alpine) can `createLang()` directly and
 * wire their own adapter via `manager.on("change", detail => ...)`.
 */
export class LangController extends BaseController<LangEvents> implements LangManager {
  readonly #fallback: string;
  readonly #normalize: boolean;
  readonly #reader: NavigatorLike | null | undefined;

  #current: string;
  #base: string;
  #region: string | null;
  #languages: readonly string[];
  #isDetected: boolean;

  constructor(options: CreateLangOptions) {
    super(options.id ?? generateId("lang"));

    const normalize = options.normalize !== false;
    const rawFallback = options.fallback ?? "en";
    this.#normalize = normalize;
    this.#fallback = normalize ? normalizeLanguageTag(rawFallback) : rawFallback;
    // Store `undefined` when caller omitted the option so
    // `resolveNavigatorSource` can fall through to the global
    // `navigator`. `options.navigator ?? null` would collapse
    // `undefined → null` and skip browser detection.
    this.#reader = options.navigator;

    const detected = detectInitialLanguage(this.#fallback, this.#normalize, this.#reader);
    this.#current = detected.current;
    this.#base = detected.base;
    this.#region = detected.region;
    this.#languages = detected.languages;
    this.#isDetected = detected.detected;
  }

  /**
   * Starts the controller. The constructor already populated state
   * from `navigator` (or fallback); `mount()` schedules the
   * `initialization` emit on a microtask so subscribers see the
   * first event with the full `LangState` shape and
   * `source: 'initialization'`, `previous: null`.
   */
  override mount(): void {
    if (this.isMounted) {
      return;
    }
    super.mount();
    queueMicrotask(() => {
      if (this.isDestroyed) {
        return;
      }
      this.#emitChange("initialization", null);
    });
  }

  /**
   * Tears down listeners and releases the singleton slot. Idempotent.
   * `super.destroy()` runs first so any registered cleanups execute
   * against a live lifecycle.
   */
  override destroy(): void {
    if (this.isDestroyed) {
      return;
    }
    super.destroy();
    clearSingleton(LANG_SINGLETON_KEY);
  }

  // ── Public state surface ────────────────────────────────────────

  get current(): string {
    return this.#current;
  }

  get base(): string {
    return this.#base;
  }

  get region(): string | null {
    return this.#region;
  }

  get languages(): readonly string[] {
    return this.#languages;
  }

  get fallback(): string {
    return this.#fallback;
  }

  get isDetected(): boolean {
    return this.#isDetected;
  }

  get(): LangState {
    return {
      current: this.#current,
      base: this.#base,
      region: this.#region,
      languages: this.#languages,
      fallback: this.#fallback,
      isDetected: this.#isDetected,
    };
  }

  // ── Public commands ─────────────────────────────────────────────

  /**
   * Sets the current language. Normalizes when `normalize` is enabled
   * (default). No-op when the value is empty or unchanged; in either
   * case no `change` event is emitted so subscribers don't churn.
   */
  set(value: string): void {
    if (this.isDestroyed) {
      return;
    }
    const next = this.#applyNormalization(value);
    if (next === "" || next === this.#current) {
      return;
    }

    const previous = this.#snapshot();
    const parts = parseLanguageTag(next);

    this.#current = next;
    this.#base = parts.base === "" ? next : parts.base;
    this.#region = parts.region;

    this.#emitChange("user", previous);
  }

  /**
   * Re-runs detection from `navigator.language` /
   * `navigator.languages`. Falls back to the configured fallback
   * when `navigator` is unavailable (SSR).
   */
  reset(): void {
    if (this.isDestroyed) {
      return;
    }

    const previous = this.#snapshot();
    const detected = detectInitialLanguage(this.#fallback, this.#normalize, this.#reader);

    this.#current = detected.current;
    this.#base = detected.base;
    this.#region = detected.region;
    this.#languages = detected.languages;
    this.#isDetected = detected.detected;

    this.#emitChange("reset", previous);
  }

  is(value: string): boolean {
    const candidate = this.#applyNormalization(value);
    if (this.#current === candidate) {
      return true;
    }
    const parts = parseLanguageTag(candidate);
    if (parts.region === null && this.#base === candidate) {
      return true;
    }
    return false;
  }

  includes(value: string): boolean {
    const candidate = this.#applyNormalization(value);
    const parts = parseLanguageTag(candidate);

    for (const tag of this.#languages) {
      if (tag === candidate) {
        return true;
      }
      if (parts.region === null) {
        const tagParts = parseLanguageTag(tag);
        if (tagParts.base === candidate) {
          return true;
        }
      }
    }
    return false;
  }

  // ── Internals ───────────────────────────────────────────────────

  /**
   * Snapshot used as the `previous` field on the next emit.
   * `languages` is reused as-is (already `readonly`) so the same
   * array reference flows through without an extra copy.
   */
  #snapshot(): LangState {
    return {
      current: this.#current,
      base: this.#base,
      region: this.#region,
      languages: this.#languages,
      fallback: this.#fallback,
      isDetected: this.#isDetected,
    };
  }

  /** Apply the configured normalization rule (no-op when disabled). */
  #applyNormalization(value: string): string {
    if (!this.#normalize) {
      return value;
    }
    return normalizeLanguageTag(value);
  }

  /** Internal emit — delegates to the inherited `BaseController.emit`. */
  #emitChange(source: LangChangeSource, previous: LangState | null): void {
    const detail: LangChangeDetail = {
      ...this.#snapshot(),
      source,
      previous,
    };
    this.emit("change", detail);
  }
}

// ── Detection helpers ────────────────────────────────────────────

interface DetectedLanguage {
  readonly current: string;
  readonly base: string;
  readonly region: string | null;
  readonly languages: readonly string[];
  readonly detected: boolean;
}

/**
 * Resolve which `NavigatorLike` to read. Three cases:
 *
 * - `reader === undefined` — caller omitted the option; use the
 *   global `navigator` if one exists.
 * - `reader === null` — caller explicitly disabled browser detection
 *   (test SSR, server adapter). Skip the global too.
 * - otherwise — use the injected reader verbatim.
 */
function resolveNavigatorSource(reader: NavigatorLike | null | undefined): NavigatorLike | null {
  if (reader !== undefined) {
    return reader;
  }
  if (typeof navigator === "undefined" || navigator === null) {
    return null;
  }
  return navigator as unknown as NavigatorLike;
}

/**
 * Eager detection read. Tries `reader` first (test injection), then
 * the global `navigator` when present (browser), and finally falls
 * back to the configured fallback. SSR-safe: when neither is
 * available, returns the fallback with `detected: false`.
 */
function detectInitialLanguage(
  fallback: string,
  normalize: boolean,
  reader: NavigatorLike | null | undefined
): DetectedLanguage {
  const navigatorSource = resolveNavigatorSource(reader);

  if (navigatorSource !== null) {
    const primary = readPrimaryLanguage(navigatorSource);
    if (primary !== null) {
      return finalize(primary, readLanguages(navigatorSource), normalize, fallback, true);
    }

    const list = readLanguages(navigatorSource);
    if (list.length > 0) {
      const head = list[0];
      if (typeof head === "string" && head.length > 0) {
        return finalize(head, list, normalize, fallback, true);
      }
    }
  }

  return finalize(fallback, [], normalize, fallback, false);
}

function readPrimaryLanguage(source: NavigatorLike): string | null {
  const value = source.language;
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readLanguages(source: NavigatorLike): readonly string[] {
  const list = source.languages;
  return Array.isArray(list) && list.length > 0 ? [...list] : [];
}

/**
 * Normalize / split the primary language and prepare the `languages`
 * snapshot. Empty primaries collapse to the fallback so derived
 * fields (`base`, `region`) never surface an empty value.
 */
function finalize(
  primary: string,
  list: readonly string[],
  normalize: boolean,
  fallback: string,
  detected: boolean
): DetectedLanguage {
  const normalizedPrimary = normalize ? normalizeLanguageTag(primary) : primary;
  const safePrimary = normalizedPrimary === "" ? fallback : normalizedPrimary;

  const parts = parseLanguageTag(safePrimary);
  const base = parts.base === "" ? fallback : parts.base;

  const languages = list.map((tag) => (normalize ? normalizeLanguageTag(tag) : tag));

  return {
    current: safePrimary,
    base,
    region: parts.region,
    languages,
    detected,
  };
}
