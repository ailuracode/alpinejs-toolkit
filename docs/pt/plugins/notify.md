---
title: "Notify"
description: "Notificações do browser e permissões push com $notify."
---

Package: `@ailuracode/alpinejs-notify`

Wrapper fino em torno da [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) via magic `$notify`. Trata navegadores não suportados e estados de permissão sem lançar exceções.

## Instalação

```bash
npm install @ailuracode/alpinejs-notify alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import notify from "@ailuracode/alpinejs-notify";

Alpine.plugin(notify);
Alpine.start();
```

Copie o service worker incluído para a raiz do seu site (ou outro caminho same-origin):

```bash
cp node_modules/@ailuracode/alpinejs-notify/dist/notify-sw.js public/notify-sw.js
```

O plugin registra `/notify-sw.js` automaticamente. Use um caminho personalizado quando necessário:

```js
Alpine.plugin(
  notify({
    serviceWorkerUrl: "/assets/notify-sw.js",
  }),
);
```

## Magic API

| Membro | Tipo | Descrição |
|--------|------|-------------|
| `isSupported` | `boolean` (getter) | `true` quando notificações podem ser exibidas neste ambiente |
| `requiresHomeScreenInstall` | `boolean` (getter) | `true` em abas Safari iOS/iPadOS que precisam de instalação na Tela de Início |
| `permission` | `NotificationPermission` (getter) | `granted`, `denied` ou `default` |
| `requestPermission()` | `Promise<NotificationPermission>` | Solicita ao usuário quando a permissão é `default` |
| `send(title, options?)` | `Notification \| null` | Cria uma notificação desktop de forma síncrona |
| `sendAsync(title, options?)` | `Promise<Notification \| null>` | Preferido em mobile; usa service worker quando necessário |
| `sendIfPermitted(title, options?)` | `Notification \| null` | Igual a `send` — intenção explícita nos templates |
| `sendIfPermittedAsync(title, options?)` | `Promise<Notification \| null>` | Igual a `sendAsync` |
| `close(notification)` | `void` | Fecha uma notificação com segurança |

Use getters sem parênteses nos templates: `$notify.isSupported`, `$notify.permission`.

Todos os métodos exceto `requestPermission()` são síncronos. Nada lança exceções quando notificações estão indisponíveis.

## Exemplos de uso

### Notificação simples

```js
$notify.send("Hello");
```

### Com opções

```js
$notify.send("Order completed", {
  body: "Your payment was successful.",
  icon: "/logo.png",
});
```

### Solicitar permissão primeiro

```html
<button
  x-show="$notify.isSupported && $notify.permission === 'default'"
  @click="await $notify.requestPermission()"
>
  Enable notifications
</button>
```

```js
await $notify.requestPermission();
await $notify.sendAsync("You are subscribed");
```

### Notificar somente quando já permitido

```js
$notify.sendIfPermitted("Background job finished");
```

### Fechar programaticamente

```html
<div
  x-data="{ note: null }"
  @job-complete.window="note = $notify.sendIfPermitted('Done')"
>
  <button x-show="note" @click="$notify.close(note); note = null">
    Dismiss
  </button>
</div>
```

### Detecção de recursos em templates

```html
<div x-show="!$notify.isSupported && !$notify.requiresHomeScreenInstall">
  Notifications are not supported in this browser.
</div>

<div x-show="$notify.requiresHomeScreenInstall">
  Add this site to your Home Screen on iPhone or iPad to enable notifications.
</div>

<div x-show="$notify.isSupported && $notify.permission === 'denied'">
  Notifications are blocked. Enable them in browser settings.
</div>
```

## Comportamento

- **Navegadores não suportados** — `isSupported` é `false`, `permission` retorna `denied`, `send` / `sendIfPermitted` retornam `null`.
- **Abas Safari iOS/iPadOS** — `requiresHomeScreenInstall` é `true`; notificações só funcionam depois que o usuário adiciona o site à Tela de Início e o abre a partir dela.
- **Android e Chrome mobile** — `new Notification()` não está disponível; o plugin usa `ServiceWorkerRegistration.showNotification()` via o `notify-sw.js` incluído.
- **Permissão negada** — `Notification` nunca é construído; métodos retornam `null` ou `denied` sem lançar exceções.
- **Permissão padrão** — `send` retorna `null` até o usuário conceder acesso via `requestPermission()`.
- **Permissão concedida** — use `sendAsync()` em mobile e `send()` em desktop.

O plugin não renderiza UI, não gerencia pilhas de toast nem persiste preferências. Use seus próprios componentes para mensagens in-app e UX de permissão.

## Compatibilidade entre navegadores

| Ambiente | Notas |
|-------------|-------|
| Chrome, Edge, Opera (desktop) | Suportado em contextos seguros via `new Notification()` |
| Firefox (desktop) | Suportado em contextos seguros |
| Safari (macOS 16.4+) | Suportado em contextos seguros |
| Chrome (Android) | Exige o service worker incluído e `sendAsync()` |
| Safari (iOS / iPadOS) | Apenas web app na Tela de Início; abas Safari regulares não recebem notificações |
| HTTP (não-localhost) | Bloqueado — exige HTTPS |
| Web Workers / Service Workers | Este plugin visa `window` / templates Alpine no documento principal |

Sempre verifique `isSupported`, `requiresHomeScreenInstall` e `permission` antes de exibir prompts de permissão ou assumir que notificações aparecerão.

## TypeScript

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpinejs-notify" />
```

Ou importe o módulo do plugin:

```ts
import notify from "@ailuracode/alpinejs-notify";
```

Helpers individuais também são exportados para uso fora do Alpine:

```ts
import {
  createNotifyMagic,
  isNotifySupported,
  sendNotification,
} from "@ailuracode/alpinejs-notify";
```

## Notas de design

- **Magic, no store** — notificações são ações pontuais, não estado reativo compartilhado.
- **Falha silenciosa** — retornar `null` mantém expressões Alpine e handlers de eventos simples.
- **Sem acoplamento de UI** — agnóstico a framework; combine com seus próprios componentes toast ou banner para feedback in-page.
