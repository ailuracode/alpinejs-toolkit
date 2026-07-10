/**
 * Ambient type surface for `@ailuracode/alpine-lang`.
 *
 * Re-exports the {@link LangStore} shape so consumers can include this
 * file via the global.d.ts triple-slash directive and typecheck
 * `$store.lang` / `$lang` references without pulling the runtime
 * entrypoint.
 *
 * Per core's `global.d.ts` convention, this package does NOT augment
 * external modules. The `Alpine.Stores` / `Alpine.Magics<T>` augmentation
 * that earlier drafts proposed has been removed — consumers that need
 * typed `$store.lang` access should declare the augmentation in their
 * own `*.d.ts` (or use the typed `Alpine<{ lang: LangStore }>` view
 * from `@ailuracode/alpine-core` directly).
 */

/// <reference types="@types/alpinejs" />

export type { LangStore } from "./types";
