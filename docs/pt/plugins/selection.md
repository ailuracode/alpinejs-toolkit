---
title: "Selection"
description: "Primitivas de seleção agnósticas a framework com modos single, multiple e range."
---

Package: `@ailuracode/alpine-selection`

Primitivas de seleção agnósticas a framework para Alpine.js — modos single, multiple e range com rastreamento de âncora.

## Instalação

```bash
pnpm add @ailuracode/alpine-selection alpinejs @ailuracode/alpine-core
```

## Configuração

```js
import Alpine from "alpinejs";
import selection from "@ailuracode/alpine-selection";

Alpine.plugin(selection());
Alpine.start();
```

## Exemplo rápido

```html
<div
  x-data="{
    items: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
    itemClass(key) {
      const snap = $store.selection.instances.list;
      if (!snap) return '';
      return snap.selectedKeys.includes(key) ? 'is-selected' : '';
    },
  }"
  x-init="$store.selection.create('list', { mode: 'multiple', keys: items })"
>
  <p x-text="$store.selection.instances.list?.selectedKeys.join(', ') || 'none'"></p>
  <ul x-bind="$store.selection.listProps('list', { label: 'Choose items' })">
    <template x-for="item in items" :key="item">
      <li
        x-bind="$store.selection.itemProps('list', item)"
        :class="itemClass(item)"
        @click="$store.selection.toggle('list', item)"
        x-text="item"
      ></li>
    </template>
  </ul>
</div>
```

Vincule estilos e labels a `$store.selection.instances[id]` (ou `itemProps` / `listProps`) para que o Alpine rastreie mudanças de seleção. Helpers imperativos como `isSelected()` leem o controller diretamente e não disparam atualizações de template por si só.

Em métodos inline de `x-data`, referencie campos do componente com `this` (ou execute `create` de uma expressão `x-init` onde o Alpine injeta o escopo de dados):

```html
<div
  x-data="{ items: ['Alpha', 'Bravo'], mode: 'multiple' }"
  x-init="$store.selection.create('list', { mode, keys: items })"
>
```

## Store API

- `$store.selection.create(id, options)` — registra uma instância de seleção
- `$store.selection.destroy(id)` / `destroyAll()` — remove instância(s)
- `$store.selection.replace(id, key)` — substitui a seleção
- `$store.selection.toggle(id, key)` — alterna pertencimento (modo multiple)
- `$store.selection.extend(id, key)` — estende a partir da âncora (range / shift-click)
- `$store.selection.selectAll(id)` / `clear(id)` — comandos em massa
- `$store.selection.setMode(id, mode)` — alterna entre `single`, `multiple`, `range`
- `$store.selection.setKeys(id, keys)` — atualiza o registro ordenado de chaves
- `$store.selection.setDisabledKeys(id, keys)` — marca chaves como não selecionáveis
- `$store.selection.setActive(id, key)` / `setAnchor(id, key)` — foco de teclado / ponteiro
- `$store.selection.instances[id]` — snapshot readonly (`value`, `selectedKeys`, `anchorKey`, `activeKey`, `mode`)
- `$store.selection.listProps` / `itemProps` — helpers ARIA listbox headless (reativos via `instances`)

## Factory de store (standalone)

Crie uma store sem o plugin Alpine completo:

```ts
import { createSelectionStore, createSelectionStoreFromController } from "@ailuracode/alpine-selection";

// Controller novo
const store = createSelectionStore();
store.create("list", { mode: "multiple", keys: ["a", "b", "c"] });
store.toggle("list", "a");

// Ou envolva um controller existente
import { SelectionController } from "@ailuracode/alpine-selection";
const controller = new SelectionController();
const store2 = createSelectionStoreFromController(controller);
```

## Factories de adapter

Adapters controlados e não controlados para wiring agnóstico a framework:

```ts
import { createControlledAdapter, createUncontrolledAdapter } from "@ailuracode/alpine-selection";

// Controlado — você possui o valor
const adapter = createControlledAdapter({
  mode: "multiple",
  value: ["a"],
  onChange: (detail) => render(detail.value),
});

// Não controlado — o controller possui o estado
const adapter2 = createUncontrolledAdapter(controller, "list", {
  mode: "multiple",
  keys: ["a", "b", "c"],
});
```

## Helpers de navegação

```ts
import {
  moveSelectableIndex,
  moveSelectableKey,
  firstSelectableIndex,
  lastSelectableIndex,
  firstSelectableKey,
  lastSelectableKey,
} from "@ailuracode/alpine-selection";

const nextIndex = moveSelectableIndex(currentIndex, 1, selectableFlags);
const nextKey = moveSelectableKey(currentKey, 1, keys, disabledKeys);
```

Use em handlers de teclado para listbox, paleta de comandos e faixas de abas.

## API do controller (sem Alpine)

```ts
import { createSelectionController } from "@ailuracode/alpine-selection";

const controller = createSelectionController();
controller.create("rows", { mode: "range", keys: ["a", "b", "c"] });
controller.on("change", ({ selectedKeys }) => {
  render(selectedKeys);
});
```

## Serialização

```ts
import { serializeSelection, deserializeSelection } from "@ailuracode/alpine-selection";

const encoded = serializeSelection(["a", "c"], "multiple"); // "a,c"
const restored = deserializeSelection(encoded, "multiple");  // ["a", "c"]
```

### Integração com URL

```ts
import { parseSelectionParam, writeSelectionParam } from "@ailuracode/alpine-selection";

// Ler da URL
const params = new URLSearchParams(window.location.search);
const value = parseSelectionParam(params, "selected", "multiple");

// Escrever na URL
writeSelectionParam(params, "selected", ["a", "c"], "multiple");
window.history.replaceState(null, "", `?${params}`);
```

## Tratamento de erros

```ts
import { SelectionError } from "@ailuracode/alpine-selection";

try {
  controller.toggle("unknown-instance", "a");
} catch (e) {
  if (e instanceof SelectionError && e.code === "INSTANCE_NOT_FOUND") {
    // tratar instância ausente
  }
}
```

## Reatividade em templates

O estado de seleção é espelhado em `$store.selection.instances[id]`. Leia desse snapshot (ou use `listProps` / `itemProps`, que derivam dele) para que o Alpine re-renderize quando a seleção mudar:

```html
<p x-text="$store.selection.instances.rows?.selectedKeys.join(', ')"></p>
```

`isSelected()`, `isActive()` e helpers similares são para código imperativo (event handlers, testes). Não registram dependências reativas em templates.

## Opções

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `mode` | `"single"` | `single`, `multiple` ou `range` |
| `keys` | `[]` | Chaves selecionáveis ordenadas (define ordem do intervalo) |
| `disabledKeys` | `[]` | Chaves que não podem ser selecionadas |
| `allowDisabledSelection` | `false` | Permite selecionar chaves desabilitadas programaticamente |
| `value` / `defaultValue` | — | Valor controlado ou inicial |
| `onChange` | — | Chamado após cada transição confirmada |

## Modos

| Modo | Forma do valor | Uso típico |
|------|----------------|------------|
| `single` | `key \| null` | Listbox, grupo de rádio, abas |
| `multiple` | `key[]` | Tabelas multi-seleção, checklists |
| `range` | `{ from, to? }` | Intervalos shift-click, calendários |

## Interações de ponteiro

| Gesto | Comando |
|-------|---------|
| Clique | `replace(id, key)` |
| Ctrl/Cmd + clique | `toggle(id, key)` (multiple) |
| Shift + clique | `extend(id, key)` (range / multiple) |

Chame `setActive(id, key)` no pointer down ou clique para manter `activeKey` sincronizado para continuação por teclado.

## Acessibilidade

Use `listProps` e `itemProps` para semântica WAI-ARIA listbox (`role`, `aria-selected`, `aria-disabled`, `aria-multiselectable`). Combine handlers de teclado com `setActive`, `moveSelectableKey` e `extend` para seleção por setas e shift-setas.

## Adoção no toolkit

`@ailuracode/alpine-calendar`, `@ailuracode/alpine-command`, `@ailuracode/alpine-tabs` e `@ailuracode/alpine-accordion` construíram sobre essas primitivas internamente. Consumidores desses pacotes não precisam instalar `@ailuracode/alpine-selection` a menos que usem as primitivas diretamente.
