---
title: "Toggle"
description: "Alternar valores booleanos com o magic $toggle."
---

Package: `@ailuracode/alpinejs-toggle`

Magic chamável `$toggle()` para máquinas de estado **binárias** e **ternárias** com unions TypeScript inferidas.

## Instalação

```bash
npm install @ailuracode/alpinejs-toggle alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import toggle from "@ailuracode/alpinejs-toggle";

Alpine.plugin(toggle);
Alpine.start();
```

## Magic API

`$toggle(options)` retorna uma instância reativa por chamada (como `$calendar()`).

### Opções

| Opção | Tipo | Descrição |
|--------|------|-------------|
| `states.truly` | `A` | Primeiro estado oposto (obrigatório) |
| `states.falsely` | `B` | Segundo estado oposto (obrigatório) |
| `states.ternary` | `N` | Terceiro estado independente opcional |
| `initial` | value | Valor inicial |

### Instância

| Membro | Descrição |
|--------|-------------|
| `value` | Estado atual |
| `states` | Objeto `{ truly, falsely, ternary }` |
| `toggle()` | Alterna entre opostos; a partir de ternary → `truly` |
| `cycle()` | Avança por todos os estados ativos |
| `set(value)` / `reset()` / `is(value)` | Helpers de estado |
| `truly` / `falsely` / `ternary` | Acessores abreviados |

## Exemplos

### Binário

```html
<div x-data="{ t: $toggle({ states: { truly: 'visible', falsely: 'hidden' } }) }">
  <p x-show="t.is(t.truly)">Shown</p>
  <button type="button" @click="t.toggle()">Toggle</button>
</div>
```

### Ternário

```html
<div x-data="{ t: $toggle({
  states: { truly: 'yes', falsely: 'no', ternary: 'unknown' },
  initial: 'unknown',
}) }">
  <span x-show="t.is(t.truly)">Yes</span>
  <span x-show="t.is(t.falsely)">No</span>
  <span x-show="t.is(t.ternary)">Unknown</span>
  <button type="button" @click="t.toggle()">Yes / No</button>
  <button type="button" @click="t.cycle()">Cycle</button>
</div>
```

## TypeScript

```ts
import { createToggle, type ToggleValue } from "@ailuracode/alpinejs-toggle";

const binary = createToggle({ states: { truly: "on", falsely: "off" } });
binary.ternary; // undefined

const ternary = createToggle({
  states: { truly: "yes", falsely: "no", ternary: "unknown" },
});
type Answer = ToggleValue<"yes", "no", "unknown">;
```

## Veja também

- [Primeiros passos](../getting-started.md)
- [Calendário](./calendar.md) — padrão similar de magic chamável
