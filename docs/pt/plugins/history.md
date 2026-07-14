---
title: "History"
description: "Controlador de histórico de desfazer/refazer para Alpine.js com transações, persistência e limites configuráveis."
---

Package: `@ailuracode/alpine-history`

Controlador de histórico headless para Alpine.js — transações, persistência e limites configuráveis. **Framework-agnostic** — sem markup, sem estilos. O controller rastreia snapshots de valores e emite eventos estruturados; você conecta sua própria UI.

## Instalação

```bash
pnpm add @ailuracode/alpine-history alpinejs @ailuracode/alpine-core
```

## Exemplo rápido

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
  <button @click="$store.history.undo()" :disabled="!$store.history.canUndo">Desfazer</button>
  <button @click="$store.history.redo()" :disabled="!$store.history.canRedo">Refazer</button>
</div>
```

## API do store (`$store.history`)

| Método / Propriedade | Descrição |
|----------------------|-----------|
| `commit(value, meta?)` | Registra um novo valor na pilha de desfazer |
| `undo()` | Remove a última entrada e a move para refazer; retorna o valor restaurado |
| `redo()` | Remove a última entrada de refazer e a move para desfazer; retorna o valor restaurado |
| `canUndo` | `true` quando a pilha de desfazer não está vazia |
| `canRedo` | `true` quando a pilha de refazer não está vazia |
| `clear()` | Esvazia ambas as pilhas |
| `reset(value?, meta?)` | Limpa as pilhas e registra um novo valor inicial |
| `checkpoint(meta?)` | Tira um snapshot do valor atual sem modificá-lo |
| `transaction(initialValue)` | Inicia um batch — retorna um `TransactionHandle` com `.commit()` e `.rollback()` |
| `value` | Valor atual (pode ser `undefined` antes do primeiro commit) |
| `undoStack` | Cópia superficial das entradas de desfazer |
| `redoStack` | Cópia superficial das entradas de refazer |
| `transactionDepth` | `> 0` enquanto uma transação está ativa |
| `destroy()` | Destrói o controller e libera recursos |

## API do magic (`$history`)

O magic chamável `$history` é um atalho para `commit`:

```html
<button @click="$history($store.history.value + 1)">+1</button>
```

O magic também expõe acessores somente leitura: `$history.current`, `$history.canUndo`, `$history.canRedo`, e todos os métodos do store (`undo`, `redo`, `clear`, `reset`, `checkpoint`, `transaction`).

## Opções do plugin

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `initialValue` | `T` | `undefined` | Valor semente — visível como `value` mas não na pilha até o primeiro commit |
| `limit` | `number` | `100` | Entradas máximas na pilha de desfazer |
| `maxSize` | `number` | `undefined` | Orçamento de bytes estimado; as entradas mais antigas são descartadas primeiro |
| `clone` | `(value: T) => T` | `structuredClone` | Estratégia de clonagem profunda |
| `equality` | `(a: T, b: T) => boolean` | `Object.is` | Deduplicação para commits consecutivos idênticos |
| `debounceMs` | `number` | `undefined` | Debounce para commits rápidos |
| `nestedTransactionPolicy` | `"stack" \| "abort"` | `"stack"` | Como lidar com transações aninhadas |
| `persistence` | `PersistenceAdapter<T>` | `undefined` | Adaptador opcional para persistir o histórico |
| `storeKey` | `string` | `"history"` | Chave do store do Alpine |

## Transações

As transações agrupam múltiplos commits em uma única entrada de desfazer:

```ts
const tx = $store.history.transaction(valorAtual);
$store.history.commit(novoValor1);
$store.history.commit(novoValor2);
tx.commit(); // insere uma única entrada de desfazer
```

Chamar `tx.rollback()` descarta todos os commits intermediários e restaura o snapshot tirado ao chamar `transaction()`.

## Persistência

Implemente a interface `PersistenceAdapter` para persistir o histórico de desfazer:

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

## API do controller (sem Alpine)

Use o controller diretamente em ambientes sem Alpine ou para testes:

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

O evento `change` é disparado em cada mutação com um `source` tipado:

| `source` | Disparado por |
|----------|---------------|
| `"initialization"` | Controller montado |
| `"commit"` | Novo valor registrado |
| `"undo"` | Navegação de desfazer |
| `"redo"` | Navegação de refazer |
| `"clear"` | Pilhas esvaziadas |
| `"reset"` | Reset para estado limpo |
| `"checkpoint"` | Snapshot registrado |
| `"transaction:start"` | Transação aberta |
| `"transaction:commit"` | Transação confirmada |
| `"transaction:rollback"` | Transação revertida |

## Veja também

- [Core](../core.md) — registry de plugins (`registerPlugin`, `initPlugins`)
