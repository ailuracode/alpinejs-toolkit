---
title: "Battery"
description: "Estado da bateria do dispositivo com o magic $battery."
---

Package: `@ailuracode/alpinejs-battery`

Status reativo da bateria via magic `$battery`. Encapsula a [Battery Status API](https://developer.mozilla.org/en-US/docs/Web/API/Battery_Status_API) quando `navigator.getBattery()` está disponível.

## Instalação

```bash
npm install @ailuracode/alpinejs-battery alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import battery from "@ailuracode/alpinejs-battery";

Alpine.plugin(battery);
Alpine.start();
```

## Magic API

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `isAvailable` | `boolean` | `true` quando dados da bateria são suportados e carregados |
| `level` | `number \| null` | Nível de carga de `0` a `1`, ou `null` quando indisponível |
| `isCharging` | `boolean` | `true` quando o dispositivo está carregando |
| `chargingTime` | `number \| null` | Segundos até carga completa, ou `null` quando desconhecido |
| `dischargingTime` | `number \| null` | Segundos até esgotar, ou `null` quando desconhecido |

## Exemplos HTML

```html
<div x-show="$battery.isAvailable" class="battery-widget">
  <span x-text="Math.round($battery.level * 100) + '%'"></span>
  <span x-show="$battery.isCharging">Charging</span>
</div>

<div x-show="!$battery.isAvailable">
  Battery status not available on this device
</div>

<div
  x-show="$battery.isAvailable && $battery.level < 0.2 && !$battery.isCharging"
  class="low-battery-warning"
>
  Low battery
</div>
```

## Notas

- O suporte entre navegadores é limitado — muitos navegadores desktop não expõem dados da bateria
- Use `isAvailable` antes de ler `level` ou o estado de carregamento
- `level` é uma fração (`0.5` = 50%); multiplique por `100` para obter porcentagem nos templates
- `chargingTime` e `dischargingTime` são `null` quando a API reporta `Infinity`
- Somente leitura — sem store, sem persistência
