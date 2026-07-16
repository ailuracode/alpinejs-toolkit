---
title: "Realtime"
description: "Transporte realtime headless com SSE e WebSocket, reconexão automática, backoff exponencial, heartbeat e pausa por visibilidade."
---

Package: `@ailuracode/alpine-realtime`

> **Estado**: Fase 1 (fundação). O contrato de tipos e as quatro utilidades puras (`calculateBackoff`, `ReconnectManager`, `HeartbeatManager`, `VisibilityManager`) estão publicadas; `RealtimeController` e a ligação Alpine chegam em fases posteriores.

Transporte realtime headless para Alpine.js — Server-Sent Events, WebSocket e adaptadores de transporte plugáveis com reconexão automática, backoff exponencial, heartbeat e pausa consciente da visibilidade.

## Instalação

```bash
pnpm add @ailuracode/alpine-realtime @ailuracode/alpine-core alpinejs
```

## Início rápido

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

## Porquê

Conexões realtime de longa duração falham de formas interessantes: redes caem em silêncio, separadores do browser entram em suspensão, servidores reiniciam, proxies fecham ligações inativas. Este pacote oferece um único controller que trata das partes difíceis — reconexão, backoff, heartbeat, visibilidade — deixando a seleção de transporte, a UI e as mensagens de erro à sua aplicação.

## O que inclui esta fase

| Símbolo | Tipo | Propósito |
|--------|------|---------|
| `RealtimeControllerConfig` | type | Config orientada ao consumidor (canal, política de retries, base / teto / jitter de backoff, intervalo / timeout de heartbeat, política de visibilidade). |
| `RealtimeControllerState` | type | Snapshot só de leitura para `$store.realtime.snapshot`. |
| `RealtimeMessage` / `RealtimeMessageInit` | type | Envelope que adaptadores trocam com o controller. |
| `RealtimeError` | class | Códigos de erro estáveis via `ToolkitError`. |
| `RealtimeEvents` | type | Mapa de eventos discriminados (`realtime:open`, `realtime:message`, `realtime:close`, `realtime:error`, `realtime:state`, `realtime:reconnect`, `realtime:giveup`). |
| `RealtimeTransportAdapter` | type | Contrato de adaptador para implementações SSE / WS / memória. |
| `calculateBackoff` | fn | Backoff exponencial puro com jitter multiplicativo; injete o seu RNG para testes. |
| `ReconnectManager` | class | Agenda tentativas de retry com abort / cancel; injeta `setTimeout` + `clearTimeout`. |
| `HeartbeatManager` | class | Máquina de estados ping/pong com medição RTT; timers injetáveis. |
| `VisibilityManager` | class | Listener `visibilitychange` seguro em SSR com `document` injetável. |

Fases posteriores adicionam:

- `RealtimeController` estendendo `BaseController`.
- Adaptadores SSE e WebSocket ligados aos transportes de runtime.
- Alpine `$store.realtime` + magia `$realtime`.

## Arquitetura

O pacote segue o **PADRÃO HEADLESS** do toolkit:

- **Sem dependência de Alpine em core/utils.** Utilidades agnósticas ao framework e seguras em SSR.
- **Zero efeitos secundários no construtor.** As classes apenas armazenam config; `start()` e `schedule()` fazem o trabalho.
- **Funções puras onde possível.** `calculateBackoff` é uma expressão única com `Math.random` injetável.
- **Timers / RNG / document injetáveis.** Os quatro managers aceitam hooks de factory para testes com linhas de tempo determinísticas.

`pnpm run architecture:check` garante que os módulos controller nunca importem `alpinejs` em runtime e que os construtores nunca toquem globals do browser.

### Evitar colisões de nomes

Se a sua aplicação já possui `$store.realtime` / `$realtime` — ou outro plugin do toolkit registra esses nomes — renomeie a superfície de integração sem tocar no controller nem no adaptador de transporte:

```ts
Alpine.plugin(
  realtimePlugin({ id: "live", magicKey: "live" })
); // → $store.live / $live
```

A chave do store deriva de `id`; a chave mágica usa `magicKey`. Ambas voltam a `"realtime"` quando não definidas.

## Testes

```bash
pnpm --filter @ailuracode/alpine-realtime test
```

Os quatro módulos de utilidades incluem cobertura Vitest orientada a 100 % da superfície pública.
