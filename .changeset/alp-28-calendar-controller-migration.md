---
"@ailuracode/alpine-calendar": major
---

Migrate `@ailuracode/alpine-calendar` to the canonical controller architecture.

- Add headless `CalendarController` extending `BaseController<CalendarEvents>` with typed `select`, `monthChange`, and `clear` events.
- Extract public types into `types.ts` (all `readonly`) and events into `events.ts`.
- Extract grid computation to `internal/grid.ts` and selection logic to `internal/selection.ts`.
- `CalendarController` owns mutable state privately — exposed through getters and `toStore()`.
- Options are readonly and normalized once at construction.
- `createCalendar()` preserved as backward-compatible alias.
- Alpine registration isolated in thin `plugin.ts` adapter.
- `index.ts` is exports-only barrel.
- **BREAKING**: `CalendarOptions` fields are now `readonly`.
- **BREAKING**: `CalendarInstance` properties (`month`, `selected`, etc.) are now getters (read-only snapshots).
- **BREAKING**: `CalendarDay` fields are now `readonly`.
- **BREAKING**: Internal modules (`internal/grid.ts`, `internal/selection.ts`) are NOT re-exported.
- **BREAKING**: `CalendarInstance` no longer has public fields — all mutations go through controller commands.
- **BREAKING**: New peer dependency `@ailuracode/alpine-core` required.
