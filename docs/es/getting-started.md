# Primeros pasos

## Requisitos

- [Alpine.js](https://alpinejs.dev/) v3+
- Un bundler con soporte ESM (Vite, Webpack, etc.) o módulos ES nativos en el navegador

## Instalación

Instala Alpine.js y uno o más paquetes:

```bash
npm install alpinejs @ailuracode/alpine-theme @ailuracode/alpine-screen
```

## Registro

Registra los plugins **antes** de `Alpine.start()`:

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

Algunos plugins aceptan opciones (p. ej. `theme`). Otros son plugins sin opciones (funciones de registro directas):

```js
Alpine.plugin(screen);
Alpine.plugin(network);
```

## Uso en HTML

### Stores

Accede al estado reactivo global con `$store`:

```html
<button :class="{ active: $store.theme.isDark }" @click="$store.theme.set('dark')">
  Dark
</button>

<div x-show="$store.device.isMobile">Mobile layout</div>
```

### Magics

Lee el estado del entorno o invoca utilidades directamente:

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

## Combinar paquetes

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

Carga plugins desde un CDN (p. ej. [esm.sh](https://esm.sh)) con módulos ES nativos:

```html
<script type="module">
  import Alpine from "https://esm.sh/alpinejs";
  import clipboard from "https://esm.sh/@ailuracode/alpine-clipboard";

  Alpine.plugin(clipboard);
  Alpine.start();
</script>
```

[esm.sh](https://esm.sh) sirve el encabezado `X-TypeScript-Types` para soporte en el editor cuando importas desde allí.

## TypeScript

Instala `@types/alpinejs` (o agrégalo como dependencia de desarrollo). Cada paquete incluye dos archivos de declaración:

| Archivo | Propósito |
|------|---------|
| `dist/index.d.ts` | Importación de módulo (`import clipboard from "…"`) |
| `dist/global.d.ts` | Ampliaciones ambientales para `$clipboard`, `$store.theme`, etc. |

### Proyectos npm

Referencia los tipos de los plugins en el entry de tu app (p. ej. `src/env.d.ts`):

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-clipboard" />
/// <reference types="@ailuracode/alpine-theme" />
```

O importa el módulo del plugin — el `index.d.ts` generado también amplía los globals de Alpine:

```ts
import clipboard from "@ailuracode/alpine-clipboard";
```

### Proyectos CDN (sin instalación npm en runtime)

**Opción A — esm.sh (recomendada):** importa desde [esm.sh](https://esm.sh). VS Code lee automáticamente el encabezado de respuesta `X-TypeScript-Types`.

**Opción B — tipos como dependencias de desarrollo** (CDN en runtime, npm solo para el editor):

```bash
npm install -D @types/alpinejs @ailuracode/alpine-clipboard
```

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpine-clipboard" />
```

**Opción C — copia `global.d.ts`** desde unpkg a tu proyecto (p. ej. `src/types/alpine-clipboard.d.ts`) y referéncialo con `/// <reference path="./types/alpine-clipboard.d.ts" />`.

`global.d.ts` no tiene sentencias `import`, así que se resuelve sin incluir el paquete completo en `node_modules` en runtime.

## Próximos pasos

- Documentación por paquete: [theme](./theme.md), [screen](./screen.md), [network](./network.md), [visibility](./visibility.md), [battery](./battery.md), [clipboard](./clipboard.md), [export](./export.md), [scroll](./scroll.md), [touch](./touch.md), [platform](./platform.md), [notify](./notify.md), [geo](./geo.md), [share](./share.md)
