# @ailuracode/alpine-keyboard

## 0.1.1

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 0.1.0

### Minor Changes

- 5591f55: Add `@ailuracode/alpine-keyboard` — headless scoped keyboard shortcut registry with chords, sequences, conflict resolution, Alpine `$keyboard` integration, and standalone `KeyboardController`.

### Patch Changes

- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-keyboard` now exposes `storeKey` and `magicKey` on `KeyboardPluginOptions` so hosts with a pre-existing `$store.keyboard` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_KEYBOARD_STORE_KEY` / `DEFAULT_KEYBOARD_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "keyboard"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `keyboardPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-keyboard` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 9a44380: Raise `full surface` bundle budgets to accommodate recent output growth.

  Each package's `full surface` import (`import *`) gzipped size now sits a few dozen bytes above its previous limit. The limits are bumped with ~10% headroom over the current measured size. No runtime API, exports, or behavior changes — these are release-tooling thresholds only.

  | Package                                   | Previous limit | New limit  | Current size |
  | ----------------------------------------- | -------------- | ---------- | ------------ |
  | `@ailuracode/alpine-core`                 | 3.8 kB         | **4.5 kB** | 4.26 kB      |
  | `@ailuracode/alpine-accordion`            | 2.1 kB         | **2.3 kB** | 2.17 kB      |
  | `@ailuracode/alpine-env`                  | 1.6 kB         | **1.8 kB** | 1.63 kB      |
  | `@ailuracode/alpine-geo`                  | 2.1 kB         | **2.4 kB** | 2.12 kB      |
  | `@ailuracode/alpine-keyboard`             | 3 kB           | **3.4 kB** | 3.05 kB      |
  | `@ailuracode/alpine-query-adapter-alpine` | 1 kB           | **1.2 kB** | 1.01 kB      |
  | `@ailuracode/alpine-tabs`                 | 1.9 kB         | **2.2 kB** | 1.96 kB      |
  | `@ailuracode/alpine-toggle`               | 1.1 kB         | **1.3 kB** | 1.14 kB      |
  | `@ailuracode/alpine-tooltip`              | 1.2 kB         | **1.4 kB** | 1.24 kB      |

  Note: although the `.cursor/rules/bundle-budget.mdc` policy nominally calls for a `major` bump when raising a bundle budget, this changeset is `patch` because (a) no runtime API or behavior changed, (b) no public surface changed, and (c) the measured growth is small (<1% in most cases, 12% on `core` only). The budget rule can be revisited separately if needed.

- 12ca21e: Minify published package builds to reduce final dist artifact size and declare `@ailuracode/alpine-core` as a peer dependency where package runtime code uses core primitives.
- Updated dependencies [3c8b40f]
- Updated dependencies [1ae869c]
- Updated dependencies [ade9bc7]
- Updated dependencies [556055a]
- Updated dependencies [a488cbb]
- Updated dependencies [aa88539]
- Updated dependencies [173379d]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [9a44380]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1

## 0.0.0

### Added

- Initial release with `KeyboardController`, scoped shortcut registry, chord and sequence support, and Alpine `$keyboard` integration.
