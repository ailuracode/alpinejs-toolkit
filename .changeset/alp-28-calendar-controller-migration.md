---
"@ailuracode/alpine-calendar": patch
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
- `CalendarOptions` fields are now `readonly`.
- `CalendarInstance` properties (`month`, `selected`, etc.) are now getters (read-only snapshots).
- `CalendarDay` fields are now `readonly`.
- Internal modules (`internal/grid.ts`, `internal/selection.ts`) are NOT re-exported.
- `CalendarInstance` no longer has public fields — all mutations go through controller commands.
- New peer dependency `@ailuracode/alpine-core` required.
