---
title: "Primeiros passos"
description: "Instale o toolkit modular do Alpine — lazy init, essenciais e TypeScript."
---

## Requisitos

- [Alpine.js](https://alpinejs.dev/) v3+
- Um bundler com suporte ESM ([Vite](https://vite.dev/), Webpack, etc.) ou ES modules nativos

## Instalação dos essenciais

Comece com o registro core e os cinco módulos essenciais:

```bash
pnpm install alpinejs \
  @ailuracode/alpine-core \
  @ailuracode/alpine-theme \
  @ailuracode/alpine-media \
  @ailuracode/alpine-scroll \
  @ailuracode/alpine-sidebar \
  @ailuracode/alpine-toast
```

Adicione mais pacotes depois — cada um é uma dependência npm independente.

## Lazy init (recomendado)

Registre os plugins na entrada da sua app (`main.js`, `app.ts`, etc.). Apenas os plugins que você inicializar são carregados pelos caminhos de import que você usa:

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  definePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpine-core";
import { themePlugin } from "@ailuracode/alpine-theme";

registerPlugin(
  "theme",
  definePlugin(["store"], {
    names: ["theme"],
    plugin: () => themePlugin(),
  })
);

registerPlugin(
  "toast",
  lazyPlugin(["magic"], {
    names: ["toast"],
    import: () => import("@ailuracode/alpine-toast"),
  })
);

registerPlugin(
  "media",
  lazyPlugin(["store"], {
    names: ["media"],
    import: () => import("@ailuracode/alpine-media"),
  })
);

Alpine.plugin(createAlpinePlugin(["theme", "toast", "media"]));
Alpine.start();
```

## Inicialização lazy

[`@ailuracode/alpine-core`](./core.md) separa **registro** (sem side effects) de **inicialização** (executa os callbacks do Alpine):

```js
import Alpine from "alpinejs";
import { initPlugins, lazyPlugin, registerPlugin } from "@ailuracode/alpine-core";

registerPlugin(
  "scroll",
  lazyPlugin(["store"], {
    names: ["scroll"],
    import: () => import("@ailuracode/alpine-scroll"),
  })
);

await initPlugins(Alpine, "scroll");
Alpine.start();
```

Use `createAlpinePlugin()` quando preferir a ponte padrão `Alpine.plugin()`. Use `initPlugins()` diretamente em entrypoints async (hidratação SSR, carregamento por rota).

Consulte [Core](./core.md) para init sync, tipos de plugin e factories como `themePlugin()`.

## Registro direto (apps simples)

Se você ainda não precisa de lazy loading, registre os plugins diretamente — sempre **antes** de `Alpine.start()`:

```js
import Alpine from "alpinejs";
import { themePlugin } from "@ailuracode/alpine-theme";
import { media } from "@ailuracode/alpine-media";

Alpine.plugin(themePlugin());
Alpine.plugin(media);

Alpine.start();
```

Migre para o registro core quando precisar de code-splitting ou um pipeline único de init.

Para reagir às transições de tema, inscreva-se na instância de `Alpine.store("theme")` e aplique as classes você mesmo — o pacote é agnóstico a framework CSS de propósito:

```js
Alpine.store("theme").on("change", (detail) => {
  document.documentElement.classList.toggle("dark", detail.resolved === "dark");
});
```

## Uso em HTML

### Stores

```html
<button @click="$store.theme.set('dark')">Escuro</button>
<button @click="$store.theme.set('light')">Claro</button>
<button @click="$store.theme.set('system')">Sistema</button>
<button @click="$store.theme.toggle()">Alternar</button>

<div x-show="$store.media.matches('mobile')">Layout mobile</div>

<button x-show="$store.scroll.showToTop" @click="$store.scroll.toTop()">
  Voltar ao topo
</button>
```

### Magics

```html
<button @click="$toast('Alterações salvas', { variant: 'success' })">Notificar</button>
```

Empurra um payload plano de dados server-rendered ou eventos:

```html
<div
  x-data
  x-init="$toast.fromPayload({ title: 'Salvo', variant: 'success' })"
></div>
```

Consulte [`$toast.fromPayload`](./plugins/toast.md) para o shape completo do payload.

## Tiers de pacotes

| Tier | Pacotes | Quando adicionar |
|------|---------|------------------|
| **Essenciais** | theme, media, scroll, sidebar | A maioria das apps Alpine |
| **Headless UI** | dialog, menu, tooltip, toast, tabs, accordion, command, carousel | UI acessível que você estiliza |
| **Extendidos** | network, attention, clipboard, platform, toggle | Conectividade, clipboard, dicas de dispositivo |
| **Avançados** | geo, battery, export, share, attention, notify, calendar, json-api | APIs especializadas do navegador |
| **Query** | query + adapter + devtools | Cache de dados no cliente (ver [Query](./query.md)) |

## CDN

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import { themePlugin } from "https://esm.sh/@ailuracode/alpine-theme";

  Alpine.plugin(themePlugin());
  Alpine.start();
</script>
```

Para reagir às transições de tema a partir de um snippet CDN:

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import { themePlugin } from "https://esm.sh/@ailuracode/alpine-theme";

  Alpine.plugin(themePlugin());
  Alpine.start();

  // Aplique classes via o magic $theme quando Alpine estiver pronto
  document.addEventListener("alpine:init", () => {
    Alpine.store("theme").on("change", (detail) => {
      document.documentElement.classList.toggle("dark", detail.resolved === "dark");
    });
  });
</script>
```

## TypeScript

Cada pacote publica `dist/index.d.ts` (imports) e `dist/global.d.ts` (augmentations do Alpine):

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-core" />
/// <reference types="@ailuracode/alpine-theme" />
/// <reference types="@ailuracode/alpine-toast" />
```

Ou importe o módulo do plugin — os tipos gerados augmentam os globals automaticamente.

## Próximos passos

- [Core](./core.md) — registro lazy e imports dinâmicos
- Essenciais — [theme](./plugins/theme.md), [media](./plugins/media.md), [scroll](./plugins/scroll.md), [sidebar](./plugins/sidebar.md)
- Headless UI — [toast](./plugins/toast.md), [dialog](./plugins/dialog.md), [menu](./plugins/menu.md), [tooltip](./plugins/tooltip.md)
- [Playground](/playground/) — demos interativos