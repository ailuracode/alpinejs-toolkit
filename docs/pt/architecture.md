# Arquitetura

Este monorepo segue as convenções do Alpine.js e divide os plugins em duas categorias.

## Stores (`Alpine.store`)

Use um **store** quando precisar de:

- **Estado mutável compartilhado** entre vários componentes
- **Ações** que alteram o estado global ou o DOM (`set`, `lock`, `cycle`)
- **Coordenação** entre partes distantes da UI (ex.: modal + bloqueio de scroll)

| Package | Store name | Propósito |
|---------|------------|-----------|
| `@ailuracode/alpine-theme` | `$store.theme` | Preferência de tema do usuário + persistência |
| `@ailuracode/alpine-screen` | `$store.device` | Breakpoints e largura do viewport |
| `@ailuracode/alpine-scroll` | `$store.scroll` | Métricas de scroll + bloqueio do body |
| `@ailuracode/alpine-geo` | `$store.geo` | Estado de geolocalização + rastreamento |
| `@ailuracode/alpine-query` | `$store.query` | Cache de consultas async (core agnóstico ao store) |
| `@ailuracode/alpine-query-adapter-nanostores` | Plugin | **Recomendado** — Nanostores + `@nanostores/alpine` |
| `@ailuracode/alpine-query-adapter-alpine` | Plugin | Adaptador nativo `Alpine.reactive` |
| `@ailuracode/alpine-query-adapter-zustand` | Plugin | Adaptador vanilla do Zustand |

### Uso em templates

```html
<p x-text="$store.theme.mode"></p>
<p x-text="$store.device.width"></p>
<button @click="$store.scroll.lock()">Lock scroll</button>
<button @click="$store.geo.request()">Get location</button>
<button @click="$store.query.invalidate(['todos'])">Refresh todos</button>
```

### Getters vs métodos

Estado derivado booleano usa **getters** (sem parênteses):

```html
<div x-show="$store.theme.isDark"></div>
<div x-show="$store.scroll.showToTop"></div>
```

Ações e verificações parametrizadas usam **métodos**:

```html
<button @click="$store.theme.set('light')">Light</button>
<span x-show="$store.device.is('tablet')"></span>
```

## Magics (`Alpine.magic`)

Use um **magic** quando precisar de:

- **Estado de ambiente somente leitura** (conectividade, tipo de ponteiro)
- **Utilitários pontuais** sem estado global de UI (copiar para a área de transferência)
- Sem coordenação de escrita entre componentes

| Package | Magic | Propósito |
|---------|-------|---------|
| `@ailuracode/alpine-network` | `$network` | `navigator.onLine` |
| `@ailuracode/alpine-visibility` | `$visibility` | Estado de visibilidade da aba |
| `@ailuracode/alpine-battery` | `$battery` | Nível de bateria e estado de carregamento |
| `@ailuracode/alpine-touch` | `$touch` | Capacidades de ponteiro / touch |
| `@ailuracode/alpine-platform` | `$platform` | Detecção de SO e plataforma do cliente |
| `@ailuracode/alpine-clipboard` | `$clipboard` | Função async de cópia |
| `@ailuracode/alpine-toast` | `$toast` | Fila de toasts in-app |
| `@ailuracode/alpine-export` | `$export` | Exportações de arquivos programáticas (downloads) |
| `@ailuracode/alpine-json-api` | `$jsonapi` | Cliente JSON:API tipado — `$jsonapi.findAll('articles')` |
| `@ailuracode/alpine-calendar` | `$calendar` | Lógica de datas de calendário — `$calendar({ weekStartsOn: 1 })` |
| `@ailuracode/alpine-toggle` | `$toggle` | Toggle binário / ternário — `$toggle({ states: { truly: 'on', falsely: 'off' } })` |
| `@ailuracode/alpine-share` | `$share` | Web Share API — `await $share(data)`, `$share.isSupported`, `$share.canShare()` |
| `@ailuracode/alpine-attention` | `$wakelock`, `$idle` | Screen Wake Lock + Idle Detection — `$wakelock.request()`, `$idle.start()` |
| `@ailuracode/alpine-notify` | `$notify` | Web Notifications API |

### Uso em templates

```html
<div x-show="!$network.isOnline">Offline</div>
<div x-show="!$visibility.isVisible">Tab in background</div>
<p x-text="$touch.maxTouchPoints"></p>
<button @click="await $clipboard(url)">Copy URL</button>

<button @click="$notify.sendIfPermitted('Saved')">Notify</button>
```

### Convenção de nomenclatura

Os magics expõem um objeto namespace com propriedades booleanas descritivas:

- `$network.isOnline` — não `$network.online`
- `$visibility.isVisible` — não `$visibility.visible`
- `$touch.isTouch` — padrão consistente `is*`

## Agnóstico a framework CSS

Os plugins **não** assumem Tailwind, shadcn nem qualquer framework CSS.

- **Theme** — apenas gerencia estado; você aplica estilos via `onChange`
- **Scroll lock** — aplica estilos inline de bloqueio; `scroll({ onLockChange })` opcional para classes ou atributos personalizados
- **Screen / network / touch** — sem estilos DOM

### Exemplo de theme (Tailwind)

```js
Alpine.plugin(theme({
  onChange({ resolved }) {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  },
}));
```

### Exemplo de theme (atributo data)

```js
Alpine.plugin(theme({
  onChange({ resolved }) {
    document.documentElement.dataset.theme = resolved;
  },
}));
```

```css
[data-theme="dark"] {
  --bg: #09090b;
}
```

## O que não está incluído

Estes pacotes evitam intencionalmente padrões no estilo React:

- Sem nomenclatura de hooks `use*`
- Sem atributos DOM específicos de framework embutidos nos plugins
- Cada pacote é instalável de forma independente e tree-shakeable por import
