# @ailuracode/alpinejs-calendar

## 0.1.2

### Patch Changes

- 28938e3: Query devtools panel overhaul: responsive mobile layout, resizable bottom panel, follow-latest and remember-open preferences, adapter badges, readable query keys, fetch duration, JSON tree editor, and toolbar back button beside reset. Query core adds fetch timing to devtools snapshots, `resetQueries`, and typed options. New `@ailuracode/alpinejs-toggle` magic plugin. Store plugins and example app updated; Vitest config migrated to TypeScript.

## 0.1.1

### Patch Changes

- 9b04a1c: Add flexible `disabled` matchers (single days, inclusive/exclusive ranges, `only` ranges, weekdays, custom predicates) and `dateFns` context passthrough for date-fns plugins such as `@date-fns/tz`.

## 0.1.0

### Minor Changes

- 62bc2e5: Add `@ailuracode/alpinejs-calendar` — Alpine.js calendar date logic powered by date-fns. Exposes `$calendar(options?)` magic for month navigation, selection (single, range, multiple), and grid data without rendering UI.
