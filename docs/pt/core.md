---
title: "Core"
description: "@ailuracode/alpine-core é o registro lazy de plugins do monorepo. Os pacotes individuais continuam instaláveis de forma independente; o core coordena o regis…"
---

`@ailuracode/alpine-core` é o registro lazy de plugins do monorepo. Os pacotes individuais continuam instaláveis de forma independente; o core coordena o registro e a inicialização sob demanda.

## Por que um core?

Cada pacote `@ailuracode/alpine-*` é um plugin standalone do Alpine.js. O core adiciona:

- **Inicialização diferida** — registra plugins sem executá-los na importação
- **Carregamento seletivo** — inicializa apenas os plugins que você precisa
- **Importações dinâmicas** — carrega código do plugin sob demanda com `lazyPlugin()`
- **Segurança SSR** — sem globals do navegador no core; os loaders rodam na inicialização

## Registro vs inicialização

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  defineMagicPlugin,
  defineStorePlugin,
  initPlugins,
  registerPlugin,
} from "@ailuracode/alpine-core";
import { sharePlugin } from "@ailuracode/alpine-transfer";
import theme from "@ailuracode/alpine-theme";

// Register (no side effects)
registerPlugin("share", defineMagicPlugin(["share"], sharePlugin));
registerPlugin(
  "theme",
  defineStorePlugin(["theme"], theme({ onChange: applyTheme }))
);

// Initialize before Alpine.start()
Alpine.plugin(createAlpinePlugin(["share", "theme"]));
Alpine.start();
```

Para importações dinâmicas:

```js
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpine-core";

registerPlugin(
  "share",
  lazyPlugin({
    kind: "magic",
    magics: ["share"],
    import: () => import("@ailuracode/alpine-transfer"),
  })
);

await initPlugins(Alpine, "share");
Alpine.start();
```

## Plugin kinds

| Tipo | Registra | Exemplo |
|------|-----------|---------|
| `magic` | `Alpine.magic()` | `$share`, `$calendar` |
| `store` | `Alpine.store()` | `$store.theme`, `$store.query` |
| `both` | magics e/ou stores | `$wakelock`, `$idle` |

Use `defineMagicPlugin`, `defineStorePlugin` ou `defineHybridPlugin` para construir definições com tipagem estrita.

## Factory plugins

Plugins como `theme` e `query` são factories que retornam um callback do Alpine. Resolva a factory **antes** de registrar:

```js
registerPlugin(
  "theme",
  defineStorePlugin(["theme"], theme({ onChange: applyTheme }))
);
```

O core não gerencia opções do plugin — apenas quando o callback resolvido é executado.

## Tree shaking

O core não importa pacotes de plugins. Você importa apenas os plugins que usa e os registra explicitamente. Pacotes não usados nunca entram no bundle.

## TypeScript

Referencie os tipos do core na sua app:

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
```

Continue referenciando os `global.d.ts` individuais de cada plugin para ampliações de `$store.*` e `$magic`.

## Resumo da API

| Função | Propósito |
|----------|---------|
| `registerPlugin(name, definition)` | Adiciona um plugin ao registro |
| `initPlugins(Alpine, names?)` | Inicializa plugins (suporta loaders async) |
| `initPluginsSync(Alpine, names?)` | Inicializa apenas plugins sync |
| `createAlpinePlugin(names?)` | Ponte para `Alpine.plugin()` |
| `lazyPlugin(options)` | Constrói uma definição com import dinâmico |
| `isPluginInitialized(name)` | Verifica o estado de init |
| `getRegisteredPlugins()` | Inspeciona o registro |
