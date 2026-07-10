# @ailuracode/alpine-child

## 1.0.0

### Minor Changes

- 7a9418a: Migrate to the framework-agnostic architecture shared with `@ailuracode/alpine-toggle`, `@ailuracode/alpine-theme`, and `@ailuracode/alpine-lang`. The package now exposes a typed `childPlugin(options)` factory that returns the `Alpine.plugin()` callback, plus the framework-agnostic helpers (`findFirstElementChild`, `countElementChildren`, `parseChildDirective`, `transferAttributes`, `clearTransferredAttributes`) as named exports for tests and custom directives.

  **Breaking changes:**

  - Drop the default-export-as-callback shape. Import the named `childPlugin` factory and call it before handing the result to `Alpine.plugin(...)`:
    ```diff
    - import child from "@ailuracode/alpine-child";
    - Alpine.plugin(child);
    + import { childPlugin } from "@ailuracode/alpine-child";
    + Alpine.plugin(childPlugin());
    ```
    The default export still aliases `childPlugin`, so existing code that imports `child from "@ailuracode/alpine-child"` continues to load — but the value is now a factory function and **must be called** before passing to `Alpine.plugin(...)`.

  **New additions:**

  - Typed public surface in `src/types.ts`: `ChildMergeMode`, `ChildDirectiveConfig`, `ChildAlpine`, `ChildMorphOptions`, `ChildPluginCallback`, `ChildPluginOptions`.
  - `ChildPluginOptions` reserved as the public seam for future cross-cutting configuration (warning sinks, mutation observers, etc.) — empty today.
  - `ChildAlpine` types the `morph(el, html, options)` helper from `@alpinejs/morph` as an optional member; the plugin runtime-checks its presence and warns when absent (same behavior as before, now first-class in the type contract).
  - Re-exports of the public types through `src/global.d.ts` for `/// <reference types="@ailuracode/alpine-child/global" />` consumers.

  **Internal:**

  - Split the monolithic `src/index.ts` + `src/transfer.ts` into `controller.ts` (framework-agnostic surface), `plugin.ts` (Alpine glue), `internal/transfer.ts` (pure merge helpers), and `types.ts` (type contracts). `index.ts` is re-exports only.
  - Build migrated from the inline `tsup src/index.ts` script to `tsup --config tsup.config.ts` with `minify: true`, matching `@ailuracode/alpine-toggle` and `@ailuracode/alpine-core`.
  - Add per-package `tsconfig.json` and `tsconfig.test.json` (extends the root, picks up the `@types/alpinejs` types, enables test-time `allowImportingTsExtensions`).
  - Add `@ailuracode/alpine-core` as both `peerDependencies` and `devDependencies` (for the `PluginCallback` / `Alpine<...>` types re-exported through the package root).
  - Add `clean`, `typecheck`, and `test:watch` scripts (the `tsup` script no longer shells out the `cp src/global.d.ts` step — the `&&` chain still copies it after build).

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.0

### Minor Changes

- Add headless UI plugins: `x-child` directive plus dialog, menu, tooltip, tabs, accordion, command, and carousel stores.

## 0.0.0

Initial release.
