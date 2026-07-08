/**
 * Ambient type augmentations consumed by `@ailuracode/alpine-core`.
 *
 * Re-exports the named-export surface of `@types/alpinejs` so consumers
 * who reference this package's `global.d.ts` get the same types as
 * `/// <reference types="@types/alpinejs" />` without forcing them to add
 * the triple-slash directive.
 *
 * Also re-exports {@link AlpineToolkit} — the interface consumers merge
 * onto `Alpine` after `corePlugin()` has run, so the runtime namespace
 * (mounted by `corePlugin()` and by the `@ailuracode/alpine-core/head`
 * snippet) typechecks cleanly.
 *
 * Per `.agents/instructions/typescript.instructions.md`, the package MUST
 * NOT augment external modules — the toolkit runtime surface is exposed
 * as a typed wrapper, not as module augmentation.
 */

export type {
    Alpine as AlpineGlobal,
    AlpineComponent,
    AlpineMagic,
    AlpineStore,
    XAttributes,
} from 'alpinejs';

export type { AlpineToolkit } from './internal/init';
