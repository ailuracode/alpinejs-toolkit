# Primeiros passos

## Requisitos

- [Alpine.js](https://alpinejs.dev/) v3+
- Um bundler com suporte ESM (Vite, Webpack, etc.) ou módulos ES nativos no navegador

## Instalação

Instale o Alpine.js e um ou mais pacotes:

```bash
npm install alpinejs @ailuracode/alpine-theme @ailuracode/alpine-screen
```

## Registro

Registre os plugins **antes** de `Alpine.start()`:

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpine-theme";
import screen from "@ailuracode/alpine-screen";
import network from "@ailuracode/alpine-network";

Alpine.plugin(theme({ onChange: applyTheme }));
Alpine.plugin(screen);
Alpine.plugin(network);

Alpine.start();
```

Alguns plugins aceitam opções (ex.: `theme`). Outros são plugins sem opções (funções de registro diretas):

```js
Alpine.plugin(screen);
Alpine.plugin(network);
```

## Uso em HTML

### Stores

Acesse o estado reativo global com `$store`:

```html
<button :class="{ active: $store.theme.isDark }" @click="$store.theme.set('dark')">
  Dark
</button>

<div x-show="$store.device.isMobile">Mobile layout</div>
```

### Magics

Leia o estado do ambiente ou chame utilitários diretamente:

```html
<div x-show="!$network.isOnline">You are offline</div>

<div x-show="!$visibility.isVisible">Tab is in the background</div>

<div x-show="$battery.isAvailable">
  Battery: <span x-text="Math.round($battery.level * 100)"></span>%
</div>

<button @click="await $clipboard('Hello')">Copy</button>

<p x-show="$touch.isTouch">Touch-optimized UI</p>

<button @click="$notify.sendIfPermitted('Task complete')">Notify</button>
```

## Combinando pacotes

```js
import Alpine from "alpinejs";
import theme from "@ailuracode/alpine-theme";
import scroll from "@ailuracode/alpine-scroll";

function applyTheme({ resolved }) {
  document.documentElement.dataset.theme = resolved;
}

Alpine.plugin(theme({ onChange: applyTheme }));
Alpine.plugin(scroll());

Alpine.start();
```

```html
<div
  class="progress"
  :style="`width: ${$store.scroll.progress}%`"
></div>

<button x-show="$store.scroll.showToTop" @click="$store.scroll.toTop()">
  Back to top
</button>
```

## CDN

Carregue plugins de um CDN (ex.: [esm.sh](https://esm.sh)) com módulos ES nativos:

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import clipboard from "https://esm.sh/@ailuracode/alpine-clipboard";

  Alpine.plugin(clipboard);
  Alpine.start();
</script>
```

O [esm.sh](https://esm.sh) serve o cabeçalho `X-TypeScript-Types` para suporte no editor quando você importa dele.

## TypeScript

Instale `@types/alpinejs` (ou adicione como dependência de desenvolvimento). Cada pacote inclui dois arquivos de declaração:

| Arquivo | Propósito |
|------|---------|
| `dist/index.d.ts` | Importação de módulo (`import clipboard from "…"`) |
| `dist/global.d.ts` | Ampliações ambientais para `$clipboard`, `$store.theme`, etc. |

### Projetos npm

Referencie os tipos dos plugins no entry da sua app (ex.: `src/env.d.ts`):

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-clipboard" />
/// <reference types="@ailuracode/alpine-theme" />
```

Ou importe o módulo do plugin — o `index.d.ts` gerado também amplia os globals do Alpine:

```ts
import clipboard from "@ailuracode/alpine-clipboard";
```

### Projetos CDN (sem instalação npm em runtime)

**Opção A — esm.sh (recomendada):** importe de [esm.sh](https://esm.sh). O VS Code lê automaticamente o cabeçalho de resposta `X-TypeScript-Types`.

**Opção B — tipos como dependências de desenvolvimento** (CDN em runtime, npm só para o editor):

```bash
npm install -D @types/alpinejs @ailuracode/alpine-clipboard
```

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-clipboard" />
```

**Opção C — copie `global.d.ts`** do unpkg para o seu projeto (ex.: `src/types/alpine-clipboard.d.ts`) e referencie com `/// <reference path="./types/alpine-clipboard.d.ts" />`.

O `global.d.ts` não tem instruções `import`, então resolve sem incluir o pacote completo em `node_modules` em runtime.

## Próximos passos

- Documentação por pacote: [theme](./theme.md), [screen](./screen.md), [network](./network.md), [visibility](./visibility.md), [battery](./battery.md), [clipboard](./clipboard.md), [export](./export.md), [scroll](./scroll.md), [touch](./touch.md), [platform](./platform.md), [notify](./notify.md), [geo](./geo.md), [share](./share.md)
