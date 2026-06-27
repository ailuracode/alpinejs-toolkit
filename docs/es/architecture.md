# Arquitectura

Este monorepo sigue las convenciones de Alpine.js y divide los plugins en dos categorías.

## Stores (`Alpine.store`)

Usa un **store** cuando necesites:

- **Estado mutable compartido** entre varios componentes
- **Acciones** que cambian el estado global o el DOM (`set`, `lock`, `cycle`)
- **Coordinación** entre partes distantes de la UI (p. ej. modal + bloqueo de scroll)

| Package | Store name | Propósito |
|---------|------------|-----------|
| `@ailuracode/alpine-theme` | `$store.theme` | Preferencia de tema del usuario + persistencia |
| `@ailuracode/alpine-screen` | `$store.device` | Breakpoints y ancho del viewport |
| `@ailuracode/alpine-scroll` | `$store.scroll` | Métricas de scroll + bloqueo del body |
| `@ailuracode/alpine-geo` | `$store.geo` | Estado de geolocalización + seguimiento |
| `@ailuracode/alpine-query` | `$store.query` | Caché de consultas async (core agnóstico al store) |
| `@ailuracode/alpine-query-adapter-nanostores` | Plugin | **Recomendado** — Nanostores + `@nanostores/alpine` |
| `@ailuracode/alpine-query-adapter-alpine` | Plugin | Adaptador nativo `Alpine.reactive` |
| `@ailuracode/alpine-query-adapter-zustand` | Plugin | Adaptador vanilla de Zustand |

### Uso en plantillas

```html
<p x-text="$store.theme.mode"></p>
<p x-text="$store.device.width"></p>
<button @click="$store.scroll.lock()">Lock scroll</button>
<button @click="$store.geo.request()">Get location</button>
<button @click="$store.query.invalidate(['todos'])">Refresh todos</button>
```

### Getters vs métodos

El estado derivado booleano usa **getters** (sin paréntesis):

```html
<div x-show="$store.theme.isDark"></div>
<div x-show="$store.scroll.showToTop"></div>
```

Las acciones y comprobaciones parametrizadas usan **métodos**:

```html
<button @click="$store.theme.set('light')">Light</button>
<span x-show="$store.device.is('tablet')"></span>
```

## Magics (`Alpine.magic`)

Usa un **magic** cuando necesites:

- **Estado de entorno de solo lectura** (conectividad, tipo de puntero)
- **Utilidades puntuales** sin estado global de UI (copiar al portapapeles)
- Sin coordinación de escritura entre componentes

| Package | Magic | Propósito |
|---------|-------|---------|
| `@ailuracode/alpine-network` | `$network` | `navigator.onLine` |
| `@ailuracode/alpine-visibility` | `$visibility` | Estado de visibilidad de la pestaña |
| `@ailuracode/alpine-battery` | `$battery` | Nivel de batería y estado de carga |
| `@ailuracode/alpine-touch` | `$touch` | Capacidades de puntero / touch |
| `@ailuracode/alpine-platform` | `$platform` | Detección de SO y plataforma del cliente |
| `@ailuracode/alpine-clipboard` | `$clipboard` | Función async de copia |
| `@ailuracode/alpine-toast` | `$toast` | Cola de toasts in-app |
| `@ailuracode/alpine-export` | `$export` | Exportaciones de archivos programáticas (descargas) |
| `@ailuracode/alpine-json-api` | `$jsonapi` | Cliente JSON:API tipado — `$jsonapi.findAll('articles')` |
| `@ailuracode/alpine-calendar` | `$calendar` | Lógica de fechas de calendario — `$calendar({ weekStartsOn: 1 })` |
| `@ailuracode/alpine-toggle` | `$toggle` | Toggle binario / ternario — `$toggle({ states: { truly: 'on', falsely: 'off' } })` |
| `@ailuracode/alpine-share` | `$share` | Web Share API — `await $share(data)`, `$share.isSupported`, `$share.canShare()` |
| `@ailuracode/alpine-attention` | `$wakelock`, `$idle` | Screen Wake Lock + Idle Detection — `$wakelock.request()`, `$idle.start()` |
| `@ailuracode/alpine-notify` | `$notify` | Web Notifications API |

### Uso en plantillas

```html
<div x-show="!$network.isOnline">Offline</div>
<div x-show="!$visibility.isVisible">Tab in background</div>
<p x-text="$touch.maxTouchPoints"></p>
<button @click="await $clipboard(url)">Copy URL</button>

<button @click="$notify.sendIfPermitted('Saved')">Notify</button>
```

### Convención de nombres

Los magics exponen un objeto namespace con propiedades booleanas descriptivas:

- `$network.isOnline` — no `$network.online`
- `$visibility.isVisible` — no `$visibility.visible`
- `$touch.isTouch` — patrón consistente `is*`

## Agnóstico al framework CSS

Los plugins **no** asumen Tailwind, shadcn ni ningún framework CSS.

- **Theme** — solo gestiona estado; aplicas estilos vía `onChange`
- **Scroll lock** — aplica estilos inline de bloqueo; `scroll({ onLockChange })` opcional para clases o atributos personalizados
- **Screen / network / touch** — sin estilos DOM

### Ejemplo de theme (Tailwind)

```js
Alpine.plugin(theme({
  onChange({ resolved }) {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  },
}));
```

### Ejemplo de theme (atributo data)

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

## Qué no está incluido

Estos paquetes evitan intencionalmente patrones al estilo React:

- Sin nomenclatura de hooks `use*`
- Sin atributos DOM específicos de framework integrados en los plugins
- Cada paquete es instalable de forma independiente y tree-shakeable por import
