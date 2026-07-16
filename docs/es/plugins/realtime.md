---
title: "Realtime"
description: "Transporte realtime headless con SSE y WebSocket, reconexión automática, backoff exponencial, heartbeat y pausa por visibilidad."
---

Package: `@ailuracode/alpine-realtime`

> **Estado**: Fase 1 (fundación). El contrato de tipos y las cuatro utilidades puras (`calculateBackoff`, `ReconnectManager`, `HeartbeatManager`, `VisibilityManager`) están publicadas; `RealtimeController` y el cableado Alpine llegan en fases posteriores.

Transporte realtime headless para Alpine.js — Server-Sent Events, WebSocket y adaptadores de transporte enchufables con reconexión automática, backoff exponencial, heartbeat y pausa consciente de la visibilidad.

## Instalación

```bash
pnpm add @ailuracode/alpine-realtime @ailuracode/alpine-core alpinejs
```

## Inicio rápido

```ts
import {
  calculateBackoff,
  HeartbeatManager,
  ReconnectManager,
  VisibilityManager,
} from "@ailuracode/alpine-realtime";

const reconnect = new ReconnectManager({
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
});

const { controller, done } = reconnect.schedule(
  () => fetchOnce(),
  0,
  { maxRetries: 5, baseDelayMs: 500, maxDelayMs: 8_000, jitterFactor: 0.5 }
);
done.then((result) => console.log("retry finished", result));
```

## Por qué

Las conexiones realtime de larga duración fallan de formas interesantes: las redes se caen en silencio, las pestañas del navegador entran en suspensión, los servidores se reinician, los proxies cierran conexiones inactivas. Este paquete ofrece un único controller que gestiona las partes difíciles — reconexión, backoff, heartbeat, visibilidad — dejando la selección de transporte, la UI y los mensajes de error a tu aplicación.

## Qué incluye esta fase

| Símbolo | Tipo | Propósito |
|--------|------|---------|
| `RealtimeControllerConfig` | type | Config orientada al consumidor (canal, política de reintentos, base / tope / jitter de backoff, intervalo / timeout de heartbeat, política de visibilidad). |
| `RealtimeControllerState` | type | Snapshot de solo lectura para `$store.realtime.snapshot`. |
| `RealtimeMessage` / `RealtimeMessageInit` | type | Sobre que intercambian adaptadores con el controller. |
| `RealtimeError` | class | Códigos de error estables vía `ToolkitError`. |
| `RealtimeEvents` | type | Mapa de eventos discriminados (`realtime:open`, `realtime:message`, `realtime:close`, `realtime:error`, `realtime:state`, `realtime:reconnect`, `realtime:giveup`). |
| `RealtimeTransportAdapter` | type | Contrato de adaptador para implementaciones SSE / WS / memoria. |
| `calculateBackoff` | fn | Backoff exponencial puro con jitter multiplicativo; inyecta tu propio RNG para tests. |
| `ReconnectManager` | class | Programa reintentos con abort / cancel; inyecta `setTimeout` + `clearTimeout`. |
| `HeartbeatManager` | class | Máquina de estados ping/pong con medición RTT; timers inyectables. |
| `VisibilityManager` | class | Listener `visibilitychange` seguro en SSR con `document` inyectable. |

Fases posteriores añaden:

- `RealtimeController` extendiendo `BaseController`.
- Adaptadores SSE y WebSocket conectados a los transportes de runtime.
- Alpine `$store.realtime` + magia `$realtime`.

## Arquitectura

El paquete sigue el **PATRÓN HEADLESS** del toolkit:

- **Sin dependencia de Alpine en core/utils.** Utilidades agnósticas al framework y seguras en SSR.
- **Cero efectos secundarios en el constructor.** Las clases solo almacenan config; `start()` y `schedule()` realizan el trabajo.
- **Funciones puras donde sea posible.** `calculateBackoff` es una expresión única con `Math.random` inyectable.
- **Timers / RNG / document inyectables.** Los cuatro managers aceptan hooks de factory para tests con líneas de tiempo deterministas.

`pnpm run architecture:check` garantiza que los módulos controller nunca importen `alpinejs` en runtime y que los constructores nunca toquen globals del navegador.

### Evitar colisiones de nombres

Si tu aplicación ya posee `$store.realtime` / `$realtime` — o otro plugin del toolkit registra esos nombres — renombra la superficie de integración sin tocar el controller ni el adaptador de transporte:

```ts
Alpine.plugin(
  realtimePlugin({ id: "live", magicKey: "live" })
); // → $store.live / $live
```

La clave del store se deriva de `id`; la clave mágica usa `magicKey`. Ambas vuelven a `"realtime"` cuando no se definen.

## Tests

```bash
pnpm --filter @ailuracode/alpine-realtime test
```

Los cuatro módulos de utilidades incluyen cobertura Vitest orientada al 100 % de la superficie pública.
