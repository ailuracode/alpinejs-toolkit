# @ailuracode/alpine-command

## 1.1.0

### Minor Changes

- 66e267a: Evolve the command palette with search ranking, aliases, dynamic predicates, nested pages, async loading/execution, persistence hooks, and headless ARIA helpers.

  - `register()` now returns an unregister callback
  - `filteredItems` includes disabled commands; keyboard execution skips them
  - `filter` is deprecated in favor of `rank` or `searchStrategy`

### Patch Changes

- 2511f89: Declare `"sideEffects": false` on publishable packages that were missing the metadata, and enforce the policy in `repo:check` and `pack:check`.
- ade9bc7: Add package-owned Playwright E2E coverage for Alpine Toolkit packages under epic ALP-55.
- 9a44380: `@ailuracode/alpine-command` now exposes `storeKey` and `magicKey` on `commandPlugin(options)` so hosts with a pre-existing `$store.command` collision can move the integration surface without forking the controller — `magicKey` follows `storeKey` by default, and the new `DEFAULT_COMMAND_STORE_KEY` / `DEFAULT_COMMAND_MAGIC_KEY` constants keep the rename discoverable from TypeScript. The Alpine integration now goes through `bridgeControllerStore` with `packageName: "command"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `commandPlugin()` instead of the raw key. Controller event-bus unsubscribes (`open` / `close` / `change`) are now bundled through the bridge's subscription cleanup so the reactive store no longer leaks listeners on plugin destroy. This unblocks `@ailuracode/alpine-command` from the `registrationGuardPending` migration list tracked by `architecture:check`.
- 711fcb7: Drop `@ailuracode/alpine-selection` runtime dependency from `tabs`, `accordion`, and `command` — matching the inline-state pattern that landed in `calendar` (see `6f008d0`). Selection state is now a plain per-group object owned by each controller; the three navigation helpers used by `command` are inlined directly. This keeps the bundle slim and removes a transitive install.

  - `tabs` selection state is a `{ value, activeKey, keys, disabledKeys }` record. The controller was also compacted (de-duplicated `toStore`/plugin store, simpler `handleKeydown`) so the bundle fits back under the 1.9 kB budget (was 2.01 kB → 1.87 kB gzipped).
  - `accordion` selection state is a `{ mode, value, selectedKeys, keys, disabledKeys }` record. Plugin now reuses `controller.toStore()` and the store factory spreads it instead of rebuilding the 17-property literal. Bundle stays at ~2.07 kB gzipped under the 2.1 kB budget.
  - `command` inlines `moveSelectableIndex`, `firstSelectableIndex`, and `lastSelectableIndex` directly into the controller.
  - All three packages removed `peerDependencies` and `devDependencies` on `@ailuracode/alpine-selection`.
  - `tabs`, `accordion`, and `command` no longer require or reference `@ailuracode/alpine-selection`. Consumers using `@ailuracode/alpine-selection` API surfaces directly are unaffected; only the indirect dependency is gone.
  - Documentation updated: install commands and feature notes no longer mention the selection package.

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
- Updated dependencies [9a44380]
- Updated dependencies [364ad60]
- Updated dependencies [3031b13]
  - @ailuracode/alpine-core@0.2.1
  - @ailuracode/alpine-scroll@2.0.1

## 1.0.0

### Patch Changes

- Updated dependencies [7a9418a]
  - @ailuracode/alpine-core@0.2.0

## 0.1.0

### Minor Changes

- Add headless UI plugins: `x-child` directive plus dialog, menu, tooltip, tabs, accordion, command, and carousel stores.
