---
title: "History"
description: "Controlador de historial de deshacer/rehacer para Alpine.js con transacciones, persistencia y límites configurables."
---

Package: `@ailuracode/alpine-history`

Controlador de historial headless para Alpine.js — transacciones, persistencia y límites configurables. **Framework-agnostic** — sin markup, sin estilos. El controller rastrea snapshots de valores y emite eventos estructurados; vos conectás tu propia UI.

## Instalación

```bash
pnpm add @ailuracode/alpine-history alpinejs @ailuracode/alpine-core
```

## Ejemplo rápido

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
  <button @click="$store.history.undo()" :disabled="!$store.history.canUndo">Deshacer</button>
  <button @click="$store.history.redo()" :disabled="!$store.history.canRedo">Rehacer</button>
</div>
```

## API del store (`$store.history`)

| Método / Propiedad | Descripción |
|---------------------|-------------|
| `commit(value, meta?)` | Registra un nuevo valor en el stack de deshacer |
| `undo()` | Saca la última entrada y la pone en rehacer; devuelve el valor restaurado |
| `redo()` | Saca la última entrada de rehacer y la pone en deshacer; devuelve el valor restaurado |
| `canUndo` | `true` cuando el stack de deshacer no está vacío |
| `canRedo` | `true` cuando el stack de rehacer no está vacío |
| `clear()` | Vacía ambos stacks |
| `reset(value?, meta?)` | Limpia los stacks y registra un nuevo valor inicial |
| `checkpoint(meta?)` | Toma un snapshot del valor actual sin modificarlo |
| `transaction(initialValue)` | Inicia un batch — devuelve un `TransactionHandle` con `.commit()` y `.rollback()` |
| `value` | Valor actual (puede ser `undefined` antes del primer commit) |
| `undoStack` | Copia superficial de las entradas de deshacer |
| `redoStack` | Copia superficial de las entradas de rehacer |
| `transactionDepth` | `> 0` mientras una transacción está activa |
| `destroy()` | Destruye el controller y libera recursos |

## API del magic (`$history`)

El magic invocable `$history` es un atajo para `commit`:

```html
<button @click="$history($store.history.value + 1)">+1</button>
```

El magic también expone accessores de solo lectura: `$history.current`, `$history.canUndo`, `$history.canRedo`, y todos los métodos del store (`undo`, `redo`, `clear`, `reset`, `checkpoint`, `transaction`).

## Opciones del plugin

| Opción | Tipo | Defecto | Descripción |
|--------|------|---------|-------------|
| `initialValue` | `T` | `undefined` | Valor semilla — visible como `value` pero no en el stack hasta el primer commit |
| `limit` | `number` | `100` | Entradas máximas en el stack de deshacer |
| `maxSize` | `number` | `undefined` | Presupuesto de bytes estimado; las entradas más antiguas se descartan primero |
| `clone` | `(value: T) => T` | `structuredClone` | Estrategia de clonado profundo |
| `equality` | `(a: T, b: T) => boolean` | `Object.is` | Deduplicación para commits consecutivos idénticos |
| `debounceMs` | `number` | `undefined` | Debounce para commits rápidos |
| `nestedTransactionPolicy` | `"stack" \| "abort"` | `"stack"` | Cómo manejar transacciones anidadas |
| `persistence` | `PersistenceAdapter<T>` | `undefined` | Adapter opcional para persistir el historial |
| `storeKey` | `string` | `"history"` | Key del store de Alpine |

## Transacciones

Las transacciones agrupan múltiples commits en una sola entrada de deshacer:

```ts
const tx = $store.history.transaction(valorActual);
$store.history.commit(nuevoValor1);
$store.history.commit(nuevoValor2);
tx.commit(); // inserta una sola entrada de deshacer
```

Llamar `tx.rollback()` descarta todos los commits intermedios y restaura el snapshot tomado al llamar `transaction()`.

## Persistencia

Implementá la interfaz `PersistenceAdapter` para persistir el historial de deshacer:

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

## API del controller (sin Alpine)

Usá el controller directamente para entornos sin Alpine o para testing:

```ts
import { HistoryController } from "@ailuracode/alpine-history";

const controller = new HistoryController({ initialValue: 0 });
controller.mount();

controller.commit(1);
controller.commit(2);
controller.undo(); // restaura 1

controller.on("change", (detail) => {
  console.log(detail.value, detail.canUndo, detail.canRedo, detail.source);
});
```

## Eventos

El evento `change` se dispara en cada mutación con un `source` tipado:

| `source` | Disparado por |
|----------|---------------|
| `"initialization"` | Controller montado |
| `"commit"` | Nuevo valor registrado |
| `"undo"` | Navegación de deshacer |
| `"redo"` | Navegación de rehacer |
| `"clear"` | Stacks vaciados |
| `"reset"` | Reset a estado fresco |
| `"checkpoint"` | Snapshot registrado |
| `"transaction:start"` | Transacción abierta |
| `"transaction:commit"` | Transacción confirmada |
| `"transaction:rollback"` | Transacción revertida |

## Ver también

- [Core](../core.md) — registry de plugins (`registerPlugin`, `initPlugins`)
