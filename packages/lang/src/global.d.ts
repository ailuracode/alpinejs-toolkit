/// <reference types="@types/alpinejs" />

export interface LangPluginOptions {
  fallback?: string;
  normalize?: boolean;
  onChange?: (language: string) => void;
}

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

export function normalizeLanguageTag(value: string): string;

export function parseLanguageTag(tag: string): { base: string; region: string | null };

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
