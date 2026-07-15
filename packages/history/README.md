# @ailuracode/alpine-history

Headless undo/redo history controller for Alpine.js — transactions, persistence, and configurable limits.

**CSS-framework agnostic** — no markup, no styles. The controller tracks value snapshots and emits structured events; you wire your own UI.

## Install

```bash
pnpm add @ailuracode/alpine-history @ailuracode/alpine-core alpinejs
```

## Quick start

```ts
import Alpine from "alpinejs";
import history from "@ailuracode/alpine-history";

Alpine.plugin(history({ initialValue: 0 }));
Alpine.start();
```

```html
<div>
  <output x-text="$store.history.value"></output>
  <button @click="$store.history.commit($store.history.value + 1)">+1</button>
  <button @click="$store.history.undo()" :disabled="!$store.history.canUndo">Undo</button>
  <button @click="$store.history.redo()" :disabled="!$store.history.canRedo">Redo</button>
</div>
```

## Store API (`$store.history`)

| Method / Property | Description |
|-------------------|-------------|
| `commit(value, meta?)` | Record a new value in the undo stack |
| `undo()` | Pop the last entry and push it to redo; returns the restored value |
| `redo()` | Pop the last redo entry and push it to undo; returns the restored value |
| `canUndo` | `true` when the undo stack is non-empty |
| `canRedo` | `true` when the redo stack is non-empty |
| `clear()` | Empty both undo and redo stacks |
| `reset(value?, meta?)` | Clear stacks and commit a fresh initial value |
| `checkpoint(meta?)` | Snapshot the current value without changing it |
| `transaction(initialValue)` | Start a batch — returns a `TransactionHandle` with `.commit()` and `.rollback()` |
| `value` | Current value (may be `undefined` before first commit) |
| `undoStack` | Shallow copy of the undo entries |
| `redoStack` | Shallow copy of the redo entries |
| `transactionDepth` | `> 0` while a transaction is active |
| `destroy()` | Tear down the controller and release resources |

## Magic API (`$history`)

The callable magic `$history` is a shorthand for `commit`:

```html
<button @click="$history($store.history.value + 1)">+1</button>
```

The magic also exposes read-only accessors: `$history.current`, `$history.canUndo`, `$history.canRedo`, and all store methods (`undo`, `redo`, `clear`, `reset`, `checkpoint`, `transaction`).

## Plugin options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `initialValue` | `T` | `undefined` | Seed value — visible as `value` but not on the undo stack until the first commit |
| `limit` | `number` | `100` | Maximum entries in the undo stack |
| `maxSize` | `number` | `undefined` | Estimated byte budget; oldest entries are evicted first |
| `clone` | `(value: T) => T` | `structuredClone` | Deep-clone strategy for entries |
| `equality` | `(a: T, b: T) => boolean` | `Object.is` | Deduplication for consecutive identical commits |
| `debounceMs` | `number` | `undefined` | Debounce rapid commits |
| `nestedTransactionPolicy` | `"stack" \| "abort"` | `"stack"` | How to handle nested `.transaction()` calls |
| `persistence` | `PersistenceAdapter<T>` | `undefined` | Optional adapter for persisting undo history |
| `storeKey` | `string` | `"history"` | Alpine store key |
| `magicKey` | `string` | `"history"` | `$history` magic key |

## Transactions

Transactions batch multiple commits into a single undo entry:

```ts
const tx = $store.history.transaction(currentValue);
$store.history.commit(newValue1);
$store.history.commit(newValue2);
tx.commit(); // pushes a single undo entry
```

Calling `tx.rollback()` discards all intermediate commits and restores the snapshot taken when `transaction()` was called.

### Avoiding name collisions

If your application already owns a `$history` store or magic — or another toolkit plugin registers on that name — rename the integration surface without touching the controller:

```ts
Alpine.plugin(
  historyPlugin({
    storeKey: "undoStack", // → $store.undoStack
    magicKey: "undo", // → $undo
  }),
);
```

The exposed constants `DEFAULT_HISTORY_MAGIC_KEY` and `HISTORY_STORE_KEY` keep the renames discoverable from TypeScript.

## Persistence

Implement the `PersistenceAdapter` interface to persist undo history across reloads:

```ts
const localStorageAdapter = {
  load() {
    const raw = localStorage.getItem("my-history");
    return raw ? JSON.parse(raw) : [];
  },
  save(entries) {
    localStorage.setItem("my-history", JSON.stringify(entries));
  },
  clear() {
    localStorage.removeItem("my-history");
  },
};

Alpine.plugin(history({ persistence: localStorageAdapter }));
```

## Controller API (no Alpine)

Use the controller directly for non-Alpine environments or testing:

```ts
import { HistoryController } from "@ailuracode/alpine-history";

const controller = new HistoryController({ initialValue: 0 });
controller.mount();

controller.commit(1);
controller.commit(2);
controller.undo(); // restores 1

controller.on("change", (detail) => {
  console.log(detail.value, detail.canUndo, detail.canRedo, detail.source);
});
```

## Events

The `change` event fires on every mutation with a typed `source`:

| `source` | Trigger |
|----------|---------|
| `"initialization"` | Controller mounted |
| `"commit"` | New value committed |
| `"undo"` | Undo navigation |
| `"redo"` | Redo navigation |
| `"clear"` | Stacks emptied |
| `"reset"` | Reset to fresh state |
| `"checkpoint"` | Snapshot recorded |
| `"transaction:start"` | Transaction opened |
| `"transaction:commit"` | Transaction committed |
| `"transaction:rollback"` | Transaction rolled back |

## See also

- [Core](../core.md) — plugin registry (`registerPlugin`, `initPlugins`)

## License

MIT
