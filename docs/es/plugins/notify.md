---
title: "Notify"
description: "Notificaciones del navegador y permisos push con $notify."
---

Package: `@ailuracode/alpinejs-notify`

Envoltorio ligero de la [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) mediante el magic `$notify`. Gestiona navegadores no soportados y estados de permiso sin lanzar excepciones.

## Instalación

```bash
npm install @ailuracode/alpinejs-notify alpinejs
```

## Configuración

```js
import Alpine from "alpinejs";
import notify from "@ailuracode/alpinejs-notify";

Alpine.plugin(notify);
Alpine.start();
```

Copia el service worker incluido a la raíz de tu sitio (u otra ruta del mismo origen):

```bash
cp node_modules/@ailuracode/alpinejs-notify/dist/notify-sw.js public/notify-sw.js
```

El plugin registra `/notify-sw.js` automáticamente. Usa una ruta personalizada cuando sea necesario:

```js
Alpine.plugin(
  notify({
    serviceWorkerUrl: "/assets/notify-sw.js",
  }),
);
```

## Magic API

| Miembro | Tipo | Descripción |
|--------|------|-------------|
| `isSupported` | `boolean` (getter) | `true` cuando las notificaciones pueden mostrarse en este entorno |
| `requiresHomeScreenInstall` | `boolean` (getter) | `true` en pestañas Safari de iOS/iPadOS que requieren instalación en pantalla de inicio |
| `permission` | `NotificationPermission` (getter) | `granted`, `denied` o `default` |
| `requestPermission()` | `Promise<NotificationPermission>` | Solicita al usuario cuando el permiso es `default` |
| `send(title, options?)` | `Notification \| null` | Crea una notificación de escritorio de forma síncrona |
| `sendAsync(title, options?)` | `Promise<Notification \| null>` | Preferido en móvil; usa un service worker cuando es necesario |
| `sendIfPermitted(title, options?)` | `Notification \| null` | Igual que `send` — intención explícita en plantillas |
| `sendIfPermittedAsync(title, options?)` | `Promise<Notification \| null>` | Igual que `sendAsync` |
| `close(notification)` | `void` | Cierra una notificación de forma segura |

Usa getters sin paréntesis en plantillas: `$notify.isSupported`, `$notify.permission`.

Todos los métodos excepto `requestPermission()` son síncronos. Nada lanza excepciones cuando las notificaciones no están disponibles.

## Ejemplos de uso

### Notificación simple

```js
$notify.send("Hello");
```

### Con opciones

```js
$notify.send("Order completed", {
  body: "Your payment was successful.",
  icon: "/logo.png",
});
```

### Solicitar permiso primero

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

### Notificar solo cuando ya está permitido

```js
$notify.sendIfPermitted("Background job finished");
```

### Cerrar programáticamente

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

### Detección de características en plantillas

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

## Comportamiento

- **Navegadores no soportados** — `isSupported` es `false`, `permission` devuelve `denied`, `send` / `sendIfPermitted` devuelven `null`.
- **Pestañas Safari iOS/iPadOS** — `requiresHomeScreenInstall` es `true`; las notificaciones solo funcionan después de que el usuario añada el sitio a la pantalla de inicio y lo abra desde allí.
- **Android y Chrome móvil** — `new Notification()` no está disponible; el plugin usa `ServiceWorkerRegistration.showNotification()` mediante el `notify-sw.js` incluido.
- **Permiso denegado** — nunca se construye `Notification`; los métodos devuelven `null` o `denied` sin lanzar excepciones.
- **Permiso predeterminado** — `send` devuelve `null` hasta que el usuario concede acceso mediante `requestPermission()`.
- **Permiso concedido** — usa `sendAsync()` en móvil y `send()` en escritorio.

El plugin no renderiza UI, no gestiona pilas de toast ni persiste preferencias. Usa tus propios componentes para mensajería en la app y UX de permisos.

## Compatibilidad con navegadores

| Entorno | Notas |
|-------------|-------|
| Chrome, Edge, Opera (escritorio) | Soportado en contextos seguros mediante `new Notification()` |
| Firefox (escritorio) | Soportado en contextos seguros |
| Safari (macOS 16.4+) | Soportado en contextos seguros |
| Chrome (Android) | Requiere el service worker incluido y `sendAsync()` |
| Safari (iOS / iPadOS) | Solo web app de pantalla de inicio; las pestañas Safari normales no pueden recibir notificaciones |
| HTTP (no localhost) | Bloqueado — requiere HTTPS |
| Web Workers / Service Workers | Este plugin apunta a `window` / plantillas Alpine en el documento principal |

Comprueba siempre `isSupported`, `requiresHomeScreenInstall` y `permission` antes de mostrar solicitudes de permiso o asumir que aparecerán notificaciones.

## TypeScript

```ts
/// <reference types="@types/alpinejs" />
/// <reference types="@ailuracode/alpinejs-notify" />
```

O importa el módulo del plugin:

```ts
import notify from "@ailuracode/alpinejs-notify";
```

Los helpers individuales también se exportan para uso fuera de Alpine:

```ts
import {
  createNotifyMagic,
  isNotifySupported,
  sendNotification,
} from "@ailuracode/alpinejs-notify";
```

## Notas de diseño

- **Magic, no store** — las notificaciones son acciones puntuales, no estado reactivo compartido.
- **Fallo silencioso** — devolver `null` mantiene simples las expresiones Alpine y los manejadores de eventos.
- **Sin acoplamiento a UI** — agnóstico al framework; combínalo con tus propios componentes toast o banner para feedback en la página.
