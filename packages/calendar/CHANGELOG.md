# @ailuracode/alpine-calendar

## 1.1.0

### Minor Changes

- c2c0611: Add `numberOfMonths` option and `months[]` multi-month grid API. Navigation moves the anchor by `numberOfMonths` months. `weeks` remains the first month grid for backward compatibility.

## 1.0.0

### Patch Changes

- Updated dependencies [9b88155]
- Updated dependencies [9b88155]
  - @ailuracode/alpine-core@0.3.0

## 0.1.4

### Patch Changes

- baa901a: Add local development dependency metadata for peer packages so bundle analysis tools can resolve published package entries.
- Updated dependencies [baa901a]
  - @ailuracode/alpine-core@0.2.2

## 0.1.3

### Patch Changes

- 2c95a00: Migrate `@ailuracode/alpine-calendar` to the canonical controller architecture.

  - Add headless `CalendarController` extending `BaseController<CalendarEvents>` with typed `select`, `monthChange`, and `clear` events.
  - Extract public types into `types.ts` (all `readonly`) and events into `events.ts`.
  - Extract grid computation to `internal/grid.ts` and selection logic to `internal/selection.ts`.
  - `CalendarController` owns mutable state privately — exposed through getters and `toStore()`.
  - Options are readonly and normalized once at construction.
  - `createCalendar()` preserved as backward-compatible alias.
  - Alpine registration isolated in thin `plugin.ts` adapter.
  - `index.ts` is exports-only barrel.
  - `CalendarOptions` fields are now `readonly`.
  - `CalendarInstance` properties (`month`, `selected`, etc.) are now getters (read-only snapshots).
  - `CalendarDay` fields are now `readonly`.
  - Internal modules (`internal/grid.ts`, `internal/selection.ts`) are NOT re-exported.
  - `CalendarInstance` no longer has public fields — all mutations go through controller commands.
  - New peer dependency `@ailuracode/alpine-core` required.

- 2511f89: Declare `"sideEffects": false` on publishable packages that were missing the metadata, and enforce the policy in `repo:check` and `pack:check`.
- 9a44380: `@ailuracode/alpine-calendar` now accepts a `CreateCalendarPluginOptions` argument (added by this release) exposing `magicKey` so hosts with a pre-existing `$calendar` collision can move the integration surface without forking the controller. The new `DEFAULT_CALENDAR_MAGIC_KEY` constant keeps the rename discoverable from TypeScript. The Alpine integration now goes through `guardMagic` with `packageName: "calendar"` so the new `RegistrationError("REGISTRATION_COLLISION")` messages name `calendarPlugin()` instead of the raw key. This unblocks `@ailuracode/alpine-calendar` from the `registrationGuardPending` migration list tracked by `architecture:check`.
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

## 0.1.2

### Patch Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpine-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.

## 0.1.1

### Patch Changes

- 9b04a1c: Add flexible `disabled` matchers (single days, inclusive/exclusive ranges, `only` ranges, weekdays, custom predicates) and `dateFns` context passthrough for date-fns plugins such as `@date-fns/tz`.

## 0.1.0

### Minor Changes

- 62bc2e5: Add `@ailuracode/alpine-calendar` — Alpine.js calendar date logic powered by date-fns. Exposes `$calendar(options?)` magic for month navigation, selection (single, range, multiple), and grid data without rendering UI.
