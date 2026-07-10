/**
 * Ambient type surface for `@ailuracode/alpine-scroll`.
 *
 * Augments `Alpine.Stores` / `Alpine.Magics<T>` with the `scroll`
 * store / magic so consumers that include this file via the
 * triple-slash directive typecheck `$store.scroll` and `$scroll`
 * references without pulling the runtime entrypoint.
 *
 * The `$scroll` magic and `$store.scroll` are interchangeable: the
 * magic returns the same reactive store proxy that `Alpine.store(
 * 'scroll' )` returns, so `x-text="$scroll.locked"` and
 * `x-text="$store.scroll.locked"` resolve to the same reactive
 * read. Mirrors the `theme` and `sidebar` convention.
 */

/// <reference types="@types/alpinejs" />

import type { ScrollStore } from "./types.js";

export type { Unsubscribe } from "@ailuracode/alpine-core";
export type {
  ScrollAlpine,
  ScrollPluginCallback,
  ScrollStore,
} from "./types.js";

declare global {
  namespace Alpine {
    interface Stores {
      scroll: ScrollStore;
    }
    interface Magics<T> {
      $scroll: ScrollStore;
    }
  }
}
