---
title: "Touch"
description: "Deteção de entrada tátil com o magic $touch."
---

Package: `@ailuracode/alpinejs-touch`

Detecta dispositivos touch e capacidades de ponteiro via magic `$touch`. Atualiza em mudanças de `matchMedia`.

## Instalação

```bash
npm install @ailuracode/alpinejs-touch alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import touch from "@ailuracode/alpinejs-touch";

Alpine.plugin(touch);
Alpine.start();
```

## Magic API

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `isTouch` | `boolean` | Dispositivo touch ou ponteiro grosso |
| `isCoarse` | `boolean` | `(pointer: coarse)` corresponde |
| `isFine` | `boolean` | `(pointer: fine)` corresponde |
| `canHover` | `boolean` | `(hover: hover)` corresponde |
| `maxTouchPoints` | `number` | `navigator.maxTouchPoints` |

`isTouch` é `true` quando qualquer uma destas condições se aplica:

- Ponteiro grosso (`pointer: coarse`)
- `maxTouchPoints > 0`
- `'ontouchstart' in window`

## Exemplos HTML

```html
<p x-show="$touch.isTouch">Touch-optimized controls</p>
<p x-show="$touch.canHover">Hover effects enabled</p>

<p>
  Pointer:
  <span x-text="$touch.isCoarse ? 'coarse (touch)' : 'fine (mouse)'"></span>
</p>
```

## Casos de uso

- Exibir alvos de toque maiores em dispositivos touch
- Desabilitar UI exclusiva de hover quando `!$touch.canHover`
- Ramificar lógica de layout junto com `@ailuracode/alpinejs-screen` para tamanho do viewport

## Notas

- Magic somente leitura — sem store
- Combina vários sinais para detecção confiável de touch
- Reage a mudanças de dispositivo / ponteiro sem recarregar a página
