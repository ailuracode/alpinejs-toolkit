---
title: "Query Kit"
description: "Cache de queries com adapter Nanostores — stack headless recomendada para Alpine."
---

Package: `@ailuracode/alpine-query-kit`

Cache de queries com adapter Nanostores — a stack headless de queries recomendada para Alpine.

Reexporta tudo de `@ailuracode/alpine-query` (núcleo do cache) mais:

- **Adapter Nanostores** — `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`
- **Diretivas** — `directivePlugin`, `magicPlugin`, `modelDirectivePlugin`

Query Devtools (painel de desenvolvimento estilizado) é distribuído por um subpath separado:
`@ailuracode/alpine-query-kit/devtools`.

## Instalação

```bash
pnpm add @ailuracode/alpine-query-kit alpinejs nanostores @nanostores/alpine
```

## Configuração

```js
import Alpine from "alpinejs";
import queryKit from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKit());
Alpine.start();
```

Registra `$store.query` e `@nanostores/alpine` (`x-nano`, `$nano`). Devtools **não** estão incluídos — importe separadamente quando necessário.

## Exemplo rápido

```ts
import Alpine from "alpinejs";
import queryKit from "@ailuracode/alpine-query-kit";

Alpine.plugin(queryKit());
Alpine.start();
```

## Devtools (desenvolvimento)

Importe devtools do subpath dedicado para manter bundles de produção headless:

```ts
import queryKit from "@ailuracode/alpine-query-kit";
import { queryDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

Alpine.plugin(queryKit());
Alpine.plugin(
  queryDevtoolsPlugin({
    position: "bottom",
    toggleCorner: "bottom-right",
    theme: "system", // segue `data-theme` do host, `.dark` ou preferência do sistema
  })
);
```

Ou registre ambos em um plugin:

```ts
import { queryKitWithDevtoolsPlugin } from "@ailuracode/alpine-query-kit/devtools";

Alpine.plugin(queryKitWithDevtoolsPlugin({ devtools: { theme: "dark" } }));
```

Carregamento lazy em desenvolvimento:

```js
if (import.meta.env.DEV) {
  const { queryDevtoolsPlugin } = await import("@ailuracode/alpine-query-kit/devtools");
  Alpine.plugin(queryDevtoolsPlugin());
}
```

### Comportamento de tema

| Opção `theme` | Comportamento |
|---------------|---------------|
| `"light"` | Força chrome claro dos devtools |
| `"dark"` | Força chrome escuro dos devtools |
| `"system"` (padrão) | Segue `data-theme` em `<html>`, depois `.dark` em `<html>`, depois `prefers-color-scheme` |

No modo `system` o painel observa `data-theme` / `class` na raiz do documento e reage a mudanças de media de color-scheme.

### Opções dos devtools

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `position` | `"bottom"` | Dock do painel: `"bottom"` ou `"right"` |
| `toggleCorner` | `"bottom-right"` | Posição do toggle flutuante |
| `persistToggleCorner` | `true` | Salva canto do toggle em `localStorage` |
| `persistPreferences` | `true` | Salva preferências do painel |
| `followLatest` | `true` | Auto-seleciona atividade de query mais recente |
| `initialOpen` | `false` | Abre painel no carregamento |
| `filter` | `""` | String de filtro inicial |
| `theme` | `"system"` | Tema de cor do painel |
| `storeName` | `"query"` | Nome da store Alpine a inspecionar |
| `additionalStores` | — | Stores de query extras para mesclar no painel |

## Uso standalone (sem Alpine)

```ts
import { createAlpineNanostoresAdapter, nanostoresQueryAdapter } from "@ailuracode/alpine-query-kit";

// Use o adapter nanostores com um query client customizado
import { createQueryClient, query } from "@ailuracode/alpine-query";

const client = createQueryClient({ adapter: nanostoresQueryAdapter });
```

## Apenas adapter Nanostores

```js
import query, { createAlpineNanostoresAdapter } from "@ailuracode/alpine-query-kit";

Alpine.plugin(query({ adapter: createAlpineNanostoresAdapter }));
```

Ou registre `$nano` sem a query store:

```js
import { NanoStores } from "@ailuracode/alpine-query-kit";

Alpine.plugin(NanoStores);
```

## API Devtools (subpath `/devtools`)

| Export | Descrição |
|--------|-----------|
| `queryDevtoolsPlugin` | Factory de plugin apenas para devtools |
| `queryKitWithDevtoolsPlugin` | Registra adapter Nanostores + painel devtools |
| `mountQueryDevtools(options)` | Monta o painel devtools programaticamente |
| `getQueryStore()` | Acessa snapshot mesclado da query store |
| `DEFAULT_PREFERENCES_STORAGE_KEY` | Chave de storage para preferências do painel |
| `TOGGLE_CORNERS` | Posições de canto disponíveis do painel |
| `DEFAULT_TOGGLE_CORNER` | Canto padrão (`"bottom-right"`) |

## Reexportações de `@ailuracode/alpine-query`

Tudo do pacote core é reexportado:

| Export | Descrição |
|--------|-----------|
| `createQueryClient` | Cria um query client com adapter |
| `query` | Factory headless de query |
| `vanillaQueryAdapter` | Adapter vanilla JS (sem reatividade) |
| `QueryStore` | Query store para integração com devtools |

## Módulos incluídos

| Módulo | Import | Descrição |
|--------|--------|-----------|
| Query cache | `@ailuracode/alpine-query-kit` | Reexporta `@ailuracode/alpine-query` (`$store.query`, `queryKey`, …) |
| Adapter Nanostores | `@ailuracode/alpine-query-kit` | `nanostoresQueryAdapter`, `createAlpineNanostoresAdapter`, `NanoStores` |
| Devtools | `@ailuracode/alpine-query-kit/devtools` | Painel inspetor estilizado (somente desenvolvimento) |

Para setups apenas Alpine/Zustand sem Nanostores, use [`@ailuracode/alpine-query`](../query.md) com [`query-adapter-alpine`](../query.md) ou [`query-adapter-zustand`](../query.md).

## Exports

APIs headless (entrada principal):

```js
import queryKit, {
  queryKey,
  nanostoresQueryAdapter,
  createAlpineNanostoresAdapter,
  nanostoresQueryPlugin,
} from "@ailuracode/alpine-query-kit";
```

APIs Devtools (subpath):

```js
import {
  queryDevtoolsPlugin,
  queryKitWithDevtoolsPlugin,
  mountQueryDevtools,
} from "@ailuracode/alpine-query-kit/devtools";
```

Veja [Query cache](../query.md) para opções de fetch, mutations e criação de adapters.
