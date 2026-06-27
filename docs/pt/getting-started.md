---
title: "Primeiros passos"
description: "Instale o toolkit Alpine modular — init lazy, essenciais e TypeScript."
---

## Requisitos

- [Alpine.js](https://alpinejs.dev/) v3+
- Um bundler com suporte ESM (Vite, Webpack, etc.) ou módulos ES nativos

## Instalar essenciais

Comece com o registro core e os cinco módulos essenciais:

```bash
npm install alpinejs \
  @ailuracode/alpinejs-core \
  @ailuracode/alpinejs-theme \
  @ailuracode/alpinejs-screen \
  @ailuracode/alpinejs-scroll \
  @ailuracode/alpinejs-sidebar \
  @ailuracode/alpinejs-toast
```

Adicione mais pacotes depois — cada um é uma dependência npm independente.

## Init lazy (recomendado)

Registre plugins no entry do app (`main.js`, `app.ts`, etc.):

```js
import Alpine from "alpinejs";
import {
  createAlpinePlugin,
  defineStorePlugin,
  lazyPlugin,
  registerPlugin,
} from "@ailuracode/alpinejs-core";

function applyTheme({ resolved }) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

registerPlugin(
  "theme",
  defineStorePlugin(["theme"], async () => {
    const { default: theme } = await import("@ailuracode/alpinejs-theme");
    return theme({ onChange: applyTheme });
  })
);

registerPlugin(
  "toast",
  lazyPlugin({
    kind: "magic",
    magics: ["toast"],
    import: () => import("@ailuracode/alpinejs-toast"),
  })
);

Alpine.plugin(createAlpinePlugin(["theme", "toast"]));
Alpine.start();
```

Consulte [Core](./core.md) para init sync, tipos de plugin e factories como `theme({ onChange })`.

## Registro direto (apps simples)

Se ainda não precisa de lazy loading, registre plugins diretamente — sempre **antes** de `Alpine.start()`:

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpinejs-theme";
import screen from "@ailuracode/alpinejs-screen";

Alpine.plugin(theme({ onChange: applyTheme }));
Alpine.plugin(screen);

Alpine.start();
```

## Uso em HTML

### Stores

```html
<button :class="{ active: $store.theme.isDark }" @click="$store.theme.set('dark')">
  Escuro
</button>

<div x-show="$store.device.isMobile">Layout mobile</div>
```

### Magics

```html
<button @click="$toast('Alterações salvas', { variant: 'success' })">Notificar</button>
```

## Níveis de pacotes

| Nível | Pacotes | Quando adicionar |
|-------|---------|------------------|
| **Essenciais** | theme, screen, scroll, sidebar, toast | A maioria dos apps Alpine |
| **Estendidos** | network, visibility, clipboard, platform, touch, toggle | Conectividade, clipboard, hints de dispositivo |
| **Avançados** | geo, battery, export, share, attention, notify, calendar, json-api | APIs de navegador especializadas |
| **Query** | query + adapter + devtools | Cache de dados no cliente (ver [Query](./query.md)) |

## Próximos passos

- [Core](./core.md) — registro lazy e imports dinâmicos
- Essenciais — [theme](./plugins/theme.md), [screen](./plugins/screen.md), [scroll](./plugins/scroll.md), [sidebar](./plugins/sidebar.md), [toast](./plugins/toast.md)
- [Playground](/playground/) — demos interativas
