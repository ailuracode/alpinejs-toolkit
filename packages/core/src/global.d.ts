/**
 * Ambient type surface for `@ailuracode/alpine-core`.
 *
 * Re-exports the named-export surface of `@types/alpinejs` so consumers
 * who reference this package's `global.d.ts` get the same types as
 * `/// <reference types="@types/alpinejs" />` without forcing them to
 * add the triple-slash directive.
 *
 * Per `.cursor/rules/formatting.mdc`, the package
 * MUST NOT augment external modules — consumers type the Alpine
 * runtime with the `Alpine<Stores>` generic from
 * `@ailuracode/alpine-core` directly.
 */

/// <reference types="@types/alpinejs" />

export type {
  Alpine as AlpineGlobal,
  AlpineComponent,
  AlpineMagic,
  AlpineStore,
  XAttributes,
} from "alpinejs";
