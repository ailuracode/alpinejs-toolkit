---
title: "Network"
description: "Estado de ligação online/offline com o magic $network."
---

Package: `@ailuracode/alpinejs-network`

Conectividade de rede reativa via magic `$network`. Encapsula `navigator.onLine` e os eventos `online` / `offline` do navegador.

## Instalação

```bash
npm install @ailuracode/alpinejs-network alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import network from "@ailuracode/alpinejs-network";

Alpine.plugin(network);
Alpine.start();
```

## Magic API

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `isOnline` | `boolean` (getter) | `true` quando o navegador indica estado online |
| `isOffline` | `boolean` (getter) | `true` quando o navegador indica estado offline |

## Exemplos HTML

```html
<div x-show="!$network.isOnline" class="offline-banner">
  You are offline
</div>

<button :disabled="!$network.isOnline">
  Save (requires connection)
</button>

<span :class="$network.isOnline ? 'dot-online' : 'dot-offline'"></span>
```

## Notas

- Reflete a indicação de conectividade do navegador, não um ping real de rede
- A nomenclatura `isOnline` evita `$network.online` redundante
- Somente leitura — sem store, sem persistência
