---
title: "Collection"
description: "Primitivas de coleção agnósticas ao framework — filtragem, ordenação, agrupamento, paginação e navegação por chave ativa."
---

Package: `@ailuracode/alpine-collection`

Primitivas de coleção agnósticas ao framework para Alpine.js — filtragem, ordenação, agrupamento, paginação e navegação por chave ativa sobre um registo de chaves estável.

## Instalação

```bash
pnpm add @ailuracode/alpine-collection
```

## Início rápido

```ts
import { createCollectionController } from "@ailuracode/alpine-collection";

type Item = { id: string; name: string; group: "fruit" | "veg" };

const collection = createCollectionController<Item>({
  items: [
    { id: "a", name: "Apple", group: "fruit" },
    { id: "b", name: "Banana", group: "fruit" },
    { id: "c", name: "Carrot", group: "veg" },
  ],
  getKey: (item) => item.id,
  isDisabled: (item) => item.id === "b",
  filter: { match: (item, query) => item.name.toLowerCase().includes(query) },
  sort: { compare: (a, b) => a.name.localeCompare(b.name) },
  group: { by: (item) => item.group },
});

collection.setFilter("ap");
collection.view; // [Apple] (Carrot filtrado, Banana desativado + filtrado)
collection.setActiveKey("c");
collection.nextActiveKey(); // "a" (filtros + ordenação)
```

## Papel arquitetural

`alpine-collection` é a **camada de estado derivado** abaixo de pacotes como `@ailuracode/alpine-command`, `@ailuracode/alpine-menu` e qualquer consumidor que possua uma lista com seleção, navegação ou paginação. Gere:

- Um **registo de itens por chave estável** derivado de um array fonte.
- Um **pipeline** de etapas puras (`filter → sort → group → paginate`) cujos resultados são memorizados por etapa e expostos como vistas derivadas só de leitura.
- **Navegação por item ativo** que sobrevive a inserções, remoções e reordenações dinâmicas.
- **Flags de itens desativados e ocultos** consultadas por cada etapa para que nem a vista nem a navegação exponham itens inalcançáveis.

Não inclui plugin Alpine nem dependência forte de Alpine. O controller nunca toca `window`, `document` nem timers no construtor.

## O que este pacote NÃO é

| Responsabilidade | Pertence a |
|---|---|
| Renderizar tabelas, listas, árvores, listboxes | Camada UI do consumidor |
| Persistir ou obter dados remotos | `@ailuracode/alpine-query` |
| Possuir valores de seleção | `@ailuracode/alpine-selection` |
| Virtualizar janelas grandes | `@ailuracode/alpine-virtual` |
| Reatividade de gestão de estado | Alpine, Nanostores, Zustand (consumidores) |

## API do controller

```ts
const collection = createCollectionController<Item, Key>(options);
```

| Membro | Tipo | Descrição |
|---|---|---|
| `view` | readonly getter | Itens após `filter → sort → group → paginate` como `ReadonlyArray`. |
| `groups` | readonly getter | `ReadonlyArray<CollectionGroup<T>>` quando `group.by` está configurado. |
| `page` | readonly getter | Página atual (quando `paginate.pageSize` está definido). |
| `pageCount` | readonly getter | Total de páginas. |
| `count` | readonly getter | `view.length`. |
| `source` | readonly getter | Array fonte original (snapshot congelado). |
| `keys` | readonly getter | Todas as chaves registadas em ordem de fonte. |
| `activeKey` | getter/setter | Âncora para `nextActiveKey` / `prevActiveKey`. |
| `query` | getter/setter | Consulta de filtro atual (`setFilter(value)` atualiza-a). |
| `setItems(items)` | comando | Substitui o registo fonte. |
| `insert(item)` | comando | Adiciona um item. |
| `remove(key)` | comando | Remove por chave. |
| `setFilter(query)` | comando | Atualiza o texto de filtro e recalcula. |
| `sort` | comando | Atualiza opções de ordenação. |
| `group` | comando | Atualiza opções de agrupamento. |
| `paginate` | comando | Atualiza opções de paginação. |
| `setPage(page)` | comando | Define a página ativa. |
| `nextActiveKey()` | comando | Avança o ativo (salta desativados/ocultos, envolve se `wrap`). |
| `prevActiveKey()` | comando | Recua o ativo. |
| `firstActiveKey()` | comando | Primeira chave selecionável na vista atual. |
| `lastActiveKey()` | comando | Última chave selecionável na vista atual. |
| `on(event, listener)` | evento | Escuta eventos `change` e `view`. |
| `destroy()` | comando | Teardown idempotente. |

## Opções do plugin

```ts
export interface CollectionOptions<T, K extends string | number> {
  readonly items?: readonly T[];
  readonly getKey?: (item: T) => K;
  readonly initialKey?: K | null;
  readonly isDisabled?: (item: T) => boolean;
  readonly isHidden?: (item: T) => boolean;
  readonly filter?: CollectionFilterOptions<T>;
  readonly sort?: CollectionSortOptions<T>;
  readonly group?: CollectionGroupOptions<T>;
  readonly paginate?: CollectionPaginateOptions;
  readonly wrap?: boolean;
}
```

## Roteiro

O plugin Alpine (`Alpine.store('collection', …)`, magia `$collection`) e um overlay de devtools estão planeados em issues do Linear posteriores. Este pacote publica primeiro o controller para que os consumidores integrem antes da camada de plugin chegar.
