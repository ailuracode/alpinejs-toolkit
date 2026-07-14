---
"@ailuracode/alpine-tabs": major
"@ailuracode/alpine-accordion": major
"@ailuracode/alpine-command": major
---

Drop `@ailuracode/alpine-selection` runtime dependency from `tabs`, `accordion`, and `command` — matching the inline-state pattern that landed in `calendar` (see `6f008d0`). Selection state is now a plain per-group object owned by each controller; the three navigation helpers used by `command` are inlined directly. This keeps the bundle slim and removes a transitive install.

- `tabs` selection state is a `{ value, activeKey, keys, disabledKeys }` record. The controller was also compacted (de-duplicated `toStore`/plugin store, simpler `handleKeydown`) so the bundle fits back under the 1.9 kB budget (was 2.01 kB → 1.87 kB gzipped).
- `accordion` selection state is a `{ mode, value, selectedKeys, keys, disabledKeys }` record. Plugin now reuses `controller.toStore()` and the store factory spreads it instead of rebuilding the 17-property literal. Bundle stays at ~2.07 kB gzipped under the 2.1 kB budget.
- `command` inlines `moveSelectableIndex`, `firstSelectableIndex`, and `lastSelectableIndex` directly into the controller.
- All three packages removed `peerDependencies` and `devDependencies` on `@ailuracode/alpine-selection`.
- **BREAKING**: `tabs`, `accordion`, and `command` no longer require or reference `@ailuracode/alpine-selection`. Consumers using `@ailuracode/alpine-selection` API surfaces directly are unaffected; only the indirect dependency is gone.
- Documentation updated: install commands and feature notes no longer mention the selection package.