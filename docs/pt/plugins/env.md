---
title: "Env"
description: "Magics de ambiente do browser: conectividade, visibilidade, bateria e plataforma."
---

Package: `@ailuracode/alpine-env`

Magics de ambiente do browser em um único pacote: conectividade, visibilidade da aba, bateria e detecção de plataforma.

O entrypoint raiz permanece focado nos magics Alpine. A API headless vive em `@ailuracode/alpine-env/controller`.

## Magics

| Magic | Descrição |
|-------|-----------|
| `$network` | Estado online / offline |
| `$visibility` | Visibilidade da aba (Page Visibility API) |
| `$battery` | Nível e carregamento da bateria |
| `$platform` | Detecção de SO e dispositivo |

## Instalação

```bash
pnpm add @ailuracode/alpine-env alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import env from "@ailuracode/alpine-env";

Alpine.plugin(env());
Alpine.start();
```

## Registro seletivo

```js
Alpine.plugin(env({ battery: false, visibility: false }));
```

## `$network`

Conectividade reativa a partir de `navigator.onLine`.

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `isOnline` | `boolean` | `true` quando online |
| `isOffline` | `boolean` | `true` quando offline |

```html
<div x-show="$network.isOffline">You are offline</div>
```

## `$visibility`

Visibilidade reativa da aba via Page Visibility API.

| Propriedade / método | Tipo | Descrição |
|-------------------|------|-------------|
| `isVisible` | `boolean` | A aba está visível |
| `isHidden` | `boolean` | A aba está oculta |
| `state` | `"visible" \| "hidden" \| "prerender"` | Estado bruto de visibilidade |
| `is(state)` | `(state) => boolean` | Compara o estado atual |

```html
<div x-show="$visibility.isHidden">Tab is in the background</div>
```

`$visibility` é registrado por [`@ailuracode/alpine-env`](./env.md). Combine com [`@ailuracode/alpine-attention`](./attention.md) quando também precisar de wake lock ou detecção de inatividade.

## `$battery`

Status reativo da bateria quando a Battery Status API está disponível.

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `isAvailable` | `boolean` | Battery Status API disponível neste browser |
| `level` | `number \| null` | Nível de carga 0–1 |
| `isCharging` | `boolean` | Se o dispositivo está carregando |
| `chargingTime` | `number \| null` | Segundos até carga completa (`null` quando desconhecido) |
| `dischargingTime` | `number \| null` | Segundos até descarga (`null` quando desconhecido) |

```html
<span x-text="`${Math.round(($battery.level ?? 0) * 100)}%`"></span>
```

## `$platform`

Flags de sistema operacional e dispositivo a partir de `navigator.userAgent` e sinais relacionados.

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `name` | `PlatformName` | `"macos"`, `"windows"`, `"linux"`, `"ios"`, `"android"`, `"chromeos"` ou `"unknown"` |
| `isMac` | `boolean` | macOS |
| `isWindows` | `boolean` | Windows |
| `isLinux` | `boolean` | Linux desktop |
| `isIos` | `boolean` | iOS (incluindo iPadOS) |
| `isAndroid` | `boolean` | Android |
| `isChromeos` | `boolean` | ChromeOS |
| `is(platform)` | `(platform) => boolean` | Compara com a plataforma detectada |

```html
<button x-show="$platform.isIos">Install on Home Screen</button>
```

Veja [Detecção de dispositivo](../device-detection.md) para quando usar `env` vs [`media`](./media.md).

## Controller headless

Use o subpath do controller quando quiser estado de ambiente com lifecycle gerenciado sem Alpine:

```js
import { createEnv } from "@ailuracode/alpine-env/controller";

const env = createEnv();
env.on("change", (detail) => {
  console.log(detail.network.isOnline);
});
```

`EnvController` é seguro para SSR na construção, inicia subscriptions em `mount()` e remove listeners em `destroy()`.

O pacote raiz não exporta mais helpers de plataforma nem controllers por feature. Importe o subpath do controller para uso headless e use o pacote raiz apenas para integração Alpine.
