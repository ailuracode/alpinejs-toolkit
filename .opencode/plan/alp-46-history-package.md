# ALP-46: `@ailuracode/alpine-history` — Implementation Plan

## Overview

Create a headless undo/redo history controller for Alpine.js. The package exists at `packages/history/` with compiled `dist/` output but an empty `src/`. We need to implement the source files, tests, package.json, and supporting infrastructure.

## Source Files to Create

### `packages/history/src/types.ts` — Public type contracts

All public types in one file, following the selection/toast pattern:

```ts
// Core strategies
CloneStrategy<T>         // (value: T) => T
EqualityStrategy<T>      // (a: T, b: T) => boolean
PersistenceAdapter<T>    // { load(), save(), clear() }

// Entry metadata
HistoryEntryMeta<TMeta>  // { id, timestamp, label?, group?, estimatedSize?, meta? }
HistoryEntry<T, TMeta>   // { value: T, meta: HistoryEntryMeta<TMeta> }

// Change events
HistoryChangeSource       // "commit" | "undo" | "redo" | "reset" | "checkpoint" | "clear"
                          // | "transaction:start" | "transaction:commit" | "transaction:rollback"
                          // | "initialization"
HistoryChangeDetail<T, TMeta>  // { source, value, canUndo, canRedo, undoStack, redoStack, transactionDepth }

// Options
NestedTransactionPolicy   // "merge" | "stack"
CreateHistoryControllerOptions<T, TMeta>  // { id?, initialValue?, limit?, maxSize?, clone?, equality?, persistence?, nestedTransactionPolicy?, debounceMs?, scope? }

// Transaction
TransactionHandle<T>      // { value: T, commit(), rollback() }

// Manager (framework-agnostic read/write surface)
HistoryManager<T, TMeta>  // extends HistoryController getters + commands + on("change") + destroy()

// Alpine surfaces
HistoryStore<T, TMeta>    // Alpine store: value mutable, rest readonly
HistoryMagic<T, TMeta>    // Callable $history() magic with shorthand methods
HistoryAlpine              // Alpine with optional cleanup?()

// Plugin
HistoryPluginCallback     // PluginCallback<AlpineBase>
ResolvedHistoryPluginConfig<TMeta>
```

### `packages/history/src/events.ts` — Typed event map

```ts
HistoryEvents<T, TMeta> = { change: HistoryChangeDetail<T, TMeta> }
```

### `packages/history/src/error.ts` — Package errors

```ts
HistoryErrorCode = "CONTROLLER_DESTROYED" | "EMPTY_STACK" | "TRANSACTION_ACTIVE"
HistoryError extends ToolkitError
```

### `packages/history/src/controller.ts` — Headless controller (core logic)

**Extends** `BaseController<HistoryEvents<T, TMeta>>`.

**Private state** (all `#field`):
- `_limit`, `_maxSize`, `_clone`, `_equality`, `_persistence`, `_nestedTransactionPolicy`, `_debounceMs`
- `_undoStack` (init `[]`), `_redoStack` (init `[]`)
- `_currentValue`, `_currentMeta`
- `_initialValue`, `_hasInitialValue` (init `false`)
- `_transactionDepth` (init `0`), `_transactionSnapshot`
- `_debounceTimer`, `_pendingCommit`

**Constructor**:
- Calls `super(options.id ?? generateId("history"))`
- Sets all options with defaults (limit=100, clone=JSON deep clone, equality=Object.is)
- If `initialValue !== undefined`: clones into `_initialValue` and `_currentValue`, sets `_hasInitialValue = true`

**`mount()`**:
- If already mounted, return
- Calls `super.mount()`
- If persistence adapter: load persisted undo stack, restore `_currentValue`/`_currentMeta` from last entry
- Queue microtask to emit `"initialization"` event

**Commands**:
- `commit(value, meta?)` — guard destroyed; if transaction active: clone to `_currentValue` and return; if equality check passes: return (dedup); create entry; if debounceMs > 0: debounce; else `#doCommit(entry)`
- `#doCommit(value, meta)` — clear redo stack; push to undo stack; set current; enforce limits; emit change; persist
- `undo()` — guard; pop undo, push clone to redo; restore current from last undo entry or initial; emit "undo"; persist; return value
- `redo()` — guard; pop redo, push clone to undo; set current; emit "redo"; persist; return value
- `clear()` — reset both stacks; emit "clear"; persist
- `reset(value, meta?)` — clear stacks; clone value; emit "reset"; persist
- `checkpoint(meta?)` — guard; push current as new entry with label "checkpoint"; clear redo; enforce limits; emit; persist
- `transaction(initialValue)` — snapshot stacks; increment depth; clone initialValue; emit "transaction:start"; return handle with commit/rollback

**`#enforceLimits()`**:
- Count-based: splice oldest if `undoStack.length > limit`
- Size-based: iterate oldest, accumulate `estimatedSize`, splice when exceeding `maxSize`

**`#emitChange(source)`** — build detail, `this.emit("change", detail)`

**`#persist()`** — if adapter: try `persistence.save([...undoStack])`, catch silently

**Factory**: `createHistoryController(options?)` → new HistoryController(options)

### `packages/history/src/store.ts` — Store wrapper

`wrapHistoryStore(controller)`:
- Creates plain object mirroring HistoryStore interface
- Subscribes to `controller.on("change")` to update `store.value`
- Returns store with destroy() cleanup

`createHistoryStore(options?)`:
- Creates new HistoryController, mounts, wraps

### `packages/history/src/plugin.ts` — Alpine integration

Uses `bridgeControllerStore()` from `@ailuracode/alpine-core`:

```ts
historyPlugin(options?) → registerHistory(alpine):
  - createHistoryController(options)
  - resolveHistoryPluginConfig(options)
  - wrapHistoryStore(controller)
  - bridgeControllerStore({ alpine, storeKey, store, controller, subscribe })
  - Alpine.magic("history", () => Alpine.store(config.storeKey))
```

Also exports:
- `resolveHistoryPluginConfig(options)` — merge defaults, add storeKey
- `historyOptions(options)` — identity for type inference
- `createHistoryMagic(config, getStore)` — callable magic with shorthand methods
- `HISTORY_STORE_KEY` constant (`"history"`)

### `packages/history/src/index.ts` — Barrel exports

Only re-exports, no logic. Re-exports everything as both named and default (plugin as default).

### `packages/history/src/global.d.ts` — Ambient type declarations

Augments `Alpine.Stores` and `Alpine.Magics` for the history store and magic.

## Test Files to Create

### `packages/history/test/controller.test.ts` — Unit tests

Tests the HistoryController directly (no Alpine), importing `../src/controller.js`:

1. **Basic commits and value tracking** — commit values, verify current value
2. **Undo/redo** — commit 3, undo 3, redo 2, verify values at each step
3. **Redo invalidation on new commit** — commit, undo, commit new → redo stack cleared
4. **History limits** — set limit=5, commit 10, verify only 5 in undo stack
5. **Memory limits (maxSize)** — set maxSize, commit large objects, verify eviction
6. **Equality strategy** — commit same value twice → only one entry (dedup)
7. **Clone strategy** — verify deep clone on commit (mutations don't affect stack)
8. **Checkpoints** — checkpoint pushes current value as entry
9. **Reset** — clears stacks, sets new value
10. **Clear** — clears both stacks without changing value
11. **Transactions** — commit within transaction, rollback, nested transactions
12. **Transaction merge vs stack policy** — verify nested policy behavior
13. **Metadata** — verify entry metadata (id, timestamp, label, group)
14. **Persistence adapter** — verify save/load/clear lifecycle
15. **Debounced commits** — verify debounce behavior with timers
16. **Multiple instances** — two controllers don't interfere
17. **SSR safety** — controller works without window/document
18. **destroy()** — cleanup, no-op after destroy
19. **Event emission** — verify change event detail shape and source values

### `packages/history/test/plugin.test.ts` — Alpine integration tests

Uses `startAlpine()` from `test/helpers.js`:

1. **Store registration** — `$store.history` exists with correct shape
2. **Magic registration** — `$history` magic is callable
3. **Store reactivity** — committing values updates `$store.history.value`
4. **Undo/redo via store** — `$store.history.undo()` / `$store.history.redo()` work
5. **Options propagation** — limit, initialValue passed through

## Package Configuration Files

### `packages/history/package.json`

Following the selection package pattern:
- `name`: `@ailuracode/alpine-history`
- `version`: `0.0.0`
- `peerDependencies`: `@ailuracode/alpine-core ^0.2.0`, `alpinejs ^3.0.0`
- `devDependencies`: `@ailuracode/alpine-core workspace:*`
- `exports`: `.` (types + default) and `./global` (types)
- `toolkit.bundleBudget.category`: `"complex-feature"`
- `size-limit`: `"full surface"` at `dist/index.js`, limit `"3.7 kB"`

### `packages/history/CHANGELOG.md`

Empty initial changelog (changeset will populate it).

## Implementation Order

1. **`types.ts`** — all type contracts
2. **`events.ts`** — event map
3. **`error.ts`** — error class
4. **`controller.ts`** — headless controller (largest file, ~400 lines)
5. **`controller.test.ts`** — unit tests for controller
6. **`store.ts`** — store wrapper
7. **`plugin.ts`** — Alpine integration
8. **`plugin.test.ts`** — integration tests
9. **`index.ts`** — barrel exports
10. **`global.d.ts`** — ambient declarations
11. **`package.json`** — package config
12. **`CHANGELOG.md`** — initial changelog
13. **Run checks**: `pnpm run typecheck`, `pnpm run lint`, `pnpm test`

## Verification Commands

```bash
pnpm run typecheck          # TypeScript compilation check
pnpm run lint               # Biome linting
pnpm test                   # Full test suite
pnpm run test:coverage      # Coverage thresholds
pnpm run build              # Build all packages
pnpm run repo:check         # Monorepo consistency
pnpm run architecture:check # Architecture invariants
```

## Key Architecture Constraints

- Controller MUST NOT import `alpinejs` at runtime (only `import type`)
- Constructor MUST NOT access browser globals, start timers, or schedule microtasks
- `mount()` and `destroy()` must be idempotent
- Mutable state MUST be private (`#field`)
- Public state via getters only
- Events emitted AFTER state transition
- `index.ts` contains ONLY re-exports
- No CSS, no Tailwind, no hardcoded themes
- Controller tests import `../src/controller.js` directly (no Alpine)
