/**
 * Documented exceptions for `scripts/architecture-check.mjs`.
 *
 * Every entry MUST cite the normative rule it relaxes and SHOULD
 * include a removal ticket when the exception is temporary.
 *
 * @see AGENTS.md — Architecture invariants
 * @see .cursor/rules/architecture.mdc
 */

/** @typedef {import("./architecture-check.mjs").ArchitectureCheckPolicy} ArchitectureCheckPolicy */

/** @type {ArchitectureCheckPolicy} */
export const ARCHITECTURE_CHECK_POLICY = {
  /**
   * Packages whose `src/index.ts` may still re-export from `src/internal/`,
   * `src/alpine/`, `src/adapter/`, or `src/bindings/`.
   *
   * ALP-30 migrated core, lang, media, and theme. Follow-up migrations:
   * - env, scroll, sidebar — still re-export from `src/internal/`
   * - command, overlay — still re-export from `src/alpine/store.js`; the
   *   store factory is consumed only by the package's own plugin/controller
   *   and should be folded into `plugin.ts` (gesture completed this in
   *   ALP-45, follow-up tickets needed for command/overlay).
   */
  internalBarrelExceptions: ["env", "scroll", "sidebar", "command", "overlay"],

  /**
   * Publishable packages that do not expose a `*Controller` class on the root
   * barrel. Magic-only, adapter, infrastructure, and directive-helper packages
   * use alternate public surfaces (`QueryCache`, JSON:API client, `x-child`
   * helpers, notify helpers, etc.).
   */
  controllerExceptions: [
    "child",
    "core",
    "env",
    "json-api",
    "notify",
    "query",
    "query-adapter-alpine",
    "query-adapter-zustand",
    "query-kit",
    "transfer",
    "ui",
  ],

  /** Private or infrastructure packages excluded from publishable checks. */
  privatePackages: ["ui"],

  /**
   * Test filenames that MAY import the package entrypoint (`src/index.ts`).
   * All other tests SHOULD import implementation modules directly.
   */
  entrypointTestPatterns: [
    /contract\.(?:spec|test)\.[cm]?[jt]sx?$/,
    /\.contract\.(?:spec|test)\.[cm]?[jt]sx?$/,
    /\.integration\.(?:spec|test)\.[cm]?[jt]sx?$/,
    /alpine(?:\.|[-])integration\.(?:spec|test)\.[cm]?[jt]sx?$/,
    /encapsulation\.test\.[cm]?[jt]sx?$/,
    /inference\.test\.[cm]?[jt]sx?$/,
    /public-surface-contract\.test\.[cm]?[jt]sx?$/,
    /architecture-boundary\.test\.[cm]?[jt]sx?$/,
    /architecture-check\.test\.[cm]?[jt]sx?$/,
    /plugin-registry\.spec\.[cm]?[jt]sx?$/,
    /load-error\.spec\.[cm]?[jt]sx?$/,
    /init\.spec\.[cm]?[jt]sx?$/,
    /singleton\.spec\.[cm]?[jt]sx?$/,
    /core-primitives\.spec\.[cm]?[jt]sx?$/,
    /base-controller\.spec\.[cm]?[jt]sx?$/,
    /alpine-types\.spec\.[cm]?[jt]sx?$/,
    /match-media\.spec\.[cm]?[jt]sx?$/,
  ],

  /** Controller-focused tests MUST import implementation modules, not the barrel. */
  controllerTestPatterns: [/controller\.(?:spec|test)\.[cm]?[jt]sx?$/],

  /**
   * Per-file opt-out for constructor side-effect checks when static analysis
   * produces a false positive. Prefer fixing the constructor instead.
   *
   * @type {readonly string[]}
   */
  constructorSideEffectExceptions: [],

  /**
   * Packages that still call `Alpine.store` / `Alpine.magic` /
   * `Alpine.directive` directly instead of routing through
   * `guardStore` / `guardMagic` / `guardDirective` from
   * `@ailuracode/alpine-core`.
   *
   * Each entry is a temporary opt-out: remove the package once it
   * migrates to the guards. New packages MUST NOT be added — they
   * ship with the guards already wired up.
   */
  registrationGuardPending: [],
};
