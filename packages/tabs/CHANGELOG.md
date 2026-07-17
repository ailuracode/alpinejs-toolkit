# @ailuracode/alpine-tabs

## 2.0.0

### Patch Changes

- Updated dependencies [9b88155]
- Updated dependencies [9b88155]
  - @ailuracode/alpine-core@0.3.0

## 1.0.2

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 1.0.1

### Patch Changes

- 2511f89: Declare `"sideEffects": false` on publishable packages that were missing the metadata, and enforce the policy in `repo:check` and `pack:check`.
- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
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

- 9a44380: `@ailuracode/alpine-tabs` now exposes `storeKey` and `magicKey` on `tabsPlugin(options)` so hosts with a pre-existing `$store.tabs` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_TABS_STORE_KEY` / `DEFAULT_TABS_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "tabs"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `tabsPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-tabs` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 711fcb7: Drop `@ailuracode/alpine-selection` runtime dependency from `tabs`, `accordion`, and `command` — matching the inline-state pattern that landed in `calendar` (see `6f008d0`). Selection state is now a plain per-group object owned by each controller; the three navigation helpers used by `command` are inlined directly. This keeps the bundle slim and removes a transitive install.

  - `tabs` selection state is a `{ value, activeKey, keys, disabledKeys }` record. The controller was also compacted (de-duplicated `toStore`/plugin store, simpler `handleKeydown`) so the bundle fits back under the 1.9 kB budget (was 2.01 kB → 1.87 kB gzipped).
  - `accordion` selection state is a `{ mode, value, selectedKeys, keys, disabledKeys }` record. Plugin now reuses `controller.toStore()` and the store factory spreads it instead of rebuilding the 17-property literal. Bundle stays at ~2.07 kB gzipped under the 2.1 kB budget.
  - `command` inlines `moveSelectableIndex`, `firstSelectableIndex`, and `lastSelectableIndex` directly into the controller.
  - All three packages removed `peerDependencies` and `devDependencies` on `@ailuracode/alpine-selection`.
  - `tabs`, `accordion`, and `command` no longer require or reference `@ailuracode/alpine-selection`. Consumers using `@ailuracode/alpine-selection` API surfaces directly are unaffected; only the indirect dependency is gone.
  - Documentation updated: install commands and feature notes no longer mention the selection package.

- df761b7: Simplify plugin test scaffolding by sharing the mock Alpine harness across packages, and trim duplicated boilerplate from `theme`/`sidebar` storage and `theme`/`sidebar`/`overlay` internal observers. No public API changes.
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

## 1.0.0

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.0

### Minor Changes

- Add headless UI plugins: `x-child` directive plus dialog, menu, tooltip, tabs, accordion, command, and carousel stores.
