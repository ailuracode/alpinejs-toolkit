---
title: "Toggle"
description: "Alternar estados binários e ternários com o magic $toggle."
---

Package: `@ailuracode/alpine-toggle`

Máquina de estados framework-agnostic para Alpine.js. Magic chamável `$toggle()` para máquinas de estado **binárias** e **ternárias** com eventos `change` tipados.

## Instalação

```bash
pnpm add @ailuracode/alpine-toggle @ailuracode/alpine-core alpinejs
```

## Configuração

```ts
import Alpine from "alpinejs";
import { togglePlugin } from "@ailuracode/alpine-toggle";

Alpine.plugin(togglePlugin());
Alpine.start();
```

## API do magic

`$toggle(options)` retorna um `ToggleController` reativo por chamada. Cada comando é encaminhado ao controller — veja o [README do pacote](https://github.com/ailuracode/alpinejs-toolkit/tree/main/packages/toggle#readme) para a arquitetura completa.

### Opções

| Opção                    | Tipo     | Descrição                                                              |
|--------------------------|----------|------------------------------------------------------------------------|
| `states.on`              | `A`      | Primeiro estado oposto (obrigatório)                                   |
| `states.off`             | `B`      | Segundo estado oposto (obrigatório)                                    |
| `states.indeterminate`   | `N`      | Terceiro estado independente opcional                                  |
| `initial`                | valor    | Valor inicial (padrão `on` em binário, `indeterminate` em ternário)    |

### Instância

| Membro                   | Descrição                                                                  |
|--------------------------|----------------------------------------------------------------------------|
| `value`                  | Estado atual                                                               |
| `states`                 | Visão `{ on, off, indeterminate }`                                         |
| `is(value)`              | Se `value` é o estado atual                                                |
| `set(value)`             | Define o estado silenciosamente — no-op se o valor não muda ou é inválido  |
| `toggle()`               | Alterna entre `on` e `off`; de `indeterminate` salta para `on`             |
| `next()`                 | Avança por todos os estados na ordem de declaração                        |
| `reset()`                | Restaura `initial`                                                         |
| `on('change', listener)` | Inscreve-se nas transições; detail = `{ current, previous, source }`      |
| `destroy()`              | Idempotente — libera todos os listeners                                    |

## Exemplos

### Binário

```html
<div x-data="{ power: $toggle({ states: { on: 'visible', off: 'hidden' } }) }">
  <p x-show="power.is(power.states.on)">Shown</p>
  <button type="button" @click="power.toggle()">Toggle</button>
</div>
```

### Ternário — quando você precisa de um terceiro estado

```html
<div x-data="{ answer: $toggle({
  states: { on: 'yes', off: 'no', indeterminate: 'unknown' },
  initial: 'unknown',
}) }">
  <span x-show="answer.is(answer.states.on)">Yes</span>
  <span x-show="answer.is(answer.states.off)">No</span>
  <span x-show="answer.is(answer.states.indeterminate)">Unknown</span>
  <button type="button" @click="answer.toggle()">Yes / No</button>
  <button type="button" @click="answer.next()">Cycle</button>
</div>
```

### Eventos `change`

```ts
import { createToggle, type ToggleChangeDetail } from "@ailuracode/alpine-toggle";

const answer = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

answer.on("change", (detail: ToggleChangeDetail<"yes", "no", "unknown">) => {
  console.log(detail.current, detail.previous, detail.source);
});
```

## TypeScript

```ts
import { createToggle, type ToggleInstance } from "@ailuracode/alpine-toggle";

const binary = createToggle({ states: { on: "on", off: "off" } });
binary.states.indeterminate; // undefined

const ternary = createToggle({
  states: { on: "yes", off: "no", indeterminate: "unknown" },
});

const instance: ToggleInstance<"yes", "no", "unknown", "yes" | "no" | "unknown"> = ternary;
```

## Veja também

- [Primeiros passos](../getting-started.md)
- [Theme](./theme.md) — store companheiro com a mesma arquitetura baseada em controllers