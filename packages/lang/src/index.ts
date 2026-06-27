import type AlpineType from "alpinejs";

export interface LangPluginOptions {
  /** Fallback language when neither `navigator.language` nor `navigator.languages` is available. Default: `"en"`. */
  fallback?: string;
  /** Lower-case the language tag. Default: `true`. */
  normalize?: boolean;
  /**
   * Read-only callback fired after every successful change of the current language.
   * Receives the normalized full language tag (e.g. `"es-ec"`).
   */
  onChange?: (language: string) => void;
}

export interface LangStore {
  /** Normalized full language tag (e.g. `"es-ec"`). Falls back to the configured `fallback`. */
  current: string;
  /** Base subtag of the current language (e.g. `"es"`). Equals `current` when there is no region. */
  base: string;
  /** Region subtag of the current language (e.g. `"ec"`). `null` when no region is present. */
  region: string | null;
  /** Snapshot of `navigator.languages` (normalized). Empty when unavailable. */
  languages: readonly string[];
  /** Effective fallback language in use. */
  readonly fallback: string;
  /** `true` when the plugin could read the language from the browser. */
  isDetected: boolean;
  /** Match the current language exactly or by base subtag. */
  is(value: string): boolean;
  /** Match any tag in `navigator.languages` by exact tag or base subtag. */
  includes(value: string): boolean;
  /** Set the current language and notify listeners. Triggers Alpine reactivity. */
  set(language: string): void;
  /** Re-detect the language from `navigator.language` / `navigator.languages`. */
  reset(): void;
}

type LangConfig = {
  fallback: string;
  normalize: boolean;
  onChange?: (language: string) => void;
};

type BrowserLanguages = readonly string[];

function hasNavigator(): boolean {
  return typeof navigator !== "undefined" && typeof navigator === "object" && navigator !== null;
}

function readBrowserLanguages(): BrowserLanguages {
  if (!hasNavigator()) {
    return [];
  }

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return [...navigator.languages];
  }

  return [];
}

function readPrimaryLanguage(): string | null {
  if (!hasNavigator()) {
    return null;
  }

  const primary = navigator.language;
  return typeof primary === "string" && primary.length > 0 ? primary : null;
}

function detectInitialLanguage(fallback: string): { initial: string; detected: boolean } {
  const primary = readPrimaryLanguage();
  if (primary !== null) {
    return { initial: primary, detected: true };
  }

  const list = readBrowserLanguages();
  if (list.length > 0 && list[0]) {
    return { initial: list[0], detected: true };
  }

  return { initial: fallback, detected: false };
}

/** Lower-case and normalize separators to `-`. Idempotent. */
export function normalizeLanguageTag(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, "-");
}

/** Split a language tag into its `[base, region | null]` parts. Does **not** mutate case. */
export function parseLanguageTag(tag: string): { base: string; region: string | null } {
  const sanitized = tag.trim().replace(/_/g, "-");
  if (sanitized === "") {
    return { base: "", region: null };
  }

  const segments = sanitized.split("-");
  const base = segments[0] ?? "";
  const region = segments.length > 1 ? (segments[1] ?? null) : null;

  return { base, region };
}

function applyNormalization(value: string, normalize: boolean): string {
  if (!normalize) {
    return value;
  }

  return normalizeLanguageTag(value);
}

function notify(config: LangConfig, language: string): void {
  config.onChange?.(language);
}

function createLangStore(
  config: LangConfig,
  initial: {
    current: string;
    base: string;
    region: string | null;
    languages: BrowserLanguages;
    detected: boolean;
  }
): LangStore {
  return {
    current: initial.current,
    base: initial.base,
    region: initial.region,
    languages: initial.languages,
    fallback: config.fallback,
    isDetected: initial.detected,

    is(value: string): boolean {
      const candidate = applyNormalization(value, config.normalize);
      const candidateParts = parseLanguageTag(candidate);

      if (this.current === candidate) {
        return true;
      }

      if (candidateParts.region === null && this.base === candidate) {
        return true;
      }

      return false;
    },

    includes(value: string): boolean {
      const candidate = applyNormalization(value, config.normalize);
      const candidateParts = parseLanguageTag(candidate);

      for (const tag of this.languages) {
        if (tag === candidate) {
          return true;
        }

        if (candidateParts.region === null) {
          const parts = parseLanguageTag(tag);
          if (parts.base === candidate) {
            return true;
          }
        }
      }

      return false;
    },

    set(language: string): void {
      const next = applyNormalization(language, config.normalize);
      if (next === "" || this.current === next) {
        return;
      }

      this.current = next;
      this.base = parseLanguageTag(next).base;
      this.region = parseLanguageTag(next).region;
      notify(config, next);
    },

    reset(): void {
      const { initial, detected } = detectFromBrowser(config);
      this.current = initial.current;
      this.base = initial.base;
      this.region = initial.region;
      this.languages = initial.languages;
      this.isDetected = detected;
      notify(config, this.current);
    },
  };
}

function detectFromBrowser(config: LangConfig): {
  initial: { current: string; base: string; region: string | null; languages: BrowserLanguages };
  detected: boolean;
} {
  const detected = detectInitialLanguage(config.fallback);
  const normalizedCurrent = applyNormalization(detected.initial, config.normalize);
  const parts = parseLanguageTag(normalizedCurrent);
  const languages = readBrowserLanguages().map((tag) => applyNormalization(tag, config.normalize));

  return {
    initial: {
      current: normalizedCurrent === "" ? config.fallback : normalizedCurrent,
      base: parts.base === "" ? config.fallback : parts.base,
      region: parts.region,
      languages,
    },
    detected: detected.detected,
  };
}

/**
 * Alpine.js language plugin.
 *
 * Registers the `$store.lang` store with the current application language and reactive
 * helpers (`is`, `includes`, `set`, `reset`). Does **not** perform translations — pair
 * it with any i18n library and call `set()` when the user picks a new language.
 */
export default function langPlugin(options: LangPluginOptions = {}): AlpineType.PluginCallback {
  const fallback = options.fallback ?? "en";
  const normalize = options.normalize ?? true;
  const config: LangConfig = {
    fallback: normalize ? normalizeLanguageTag(fallback) : fallback,
    normalize,
    onChange: options.onChange,
  };

  return function registerLang(Alpine) {
    const detected = detectFromBrowser(config);

    const langStore = createLangStore(config, {
      current: detected.initial.current,
      base: detected.initial.base,
      region: detected.initial.region,
      languages: detected.initial.languages,
      detected: detected.detected,
    });

    Alpine.store("lang", langStore);
    Alpine.magic("lang", () => Alpine.store("lang") as LangStore);
  };
}

declare global {
  namespace Alpine {
    interface Stores {
      lang: LangStore;
    }
    interface Magics<T> {
      $lang: LangStore;
    }
  }
}
