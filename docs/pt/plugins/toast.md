---
title: "Toast"
description: "Fila de toasts in-app headless com o magic $toast (sem markup nem CSS incluídos)."
---

Package: `@ailuracode/alpinejs-toast`

Fila de toasts in-app headless para Alpine.js (sem markup nem CSS incluídos). Registra o magic `$toast` e uma store reativa interna para integradores de UI.

## Agnóstico a framework CSS

Este plugin **não inclui HTML, CSS nem design tokens**. Nomes de variant e position **não são hardcoded** — você declara os conjuntos que sua UI precisa. Os únicos conceitos embutidos são:

- **`default`** — `$toast('Message')` ou `{ variant: 'default' }`
- **`bottom-right`** — `position` padrão quando omitida
- **`promise`** — `$toast.promise(factoryOrPromise, messages?)`

Mapeie `toast.variant` e `toast.position` para layout/CSS no seu próprio renderer (ex.: `data-position`, classes Tailwind, coordenadas).

## Instalação

```bash
npm install @ailuracode/alpinejs-toast alpinejs
```

## Configuração

```js
import Alpine from "alpinejs";
import toast, { toastOptions, toastPositions, toastVariants } from "@ailuracode/alpinejs-toast";

Alpine.plugin(
  toastOptions({
    variants: toastVariants(["success", "info", "warning", "error", "loading"] as const),
    positions: toastPositions(["top-center", "bottom-right"] as const),
    defaultPosition: "bottom-right",
    promise: {
      loadingVariant: "loading",
      successVariant: "success",
      errorVariant: "error",
    },
  })
);
Alpine.start();
```

`toastOptions()`, `toastVariants()` e `toastPositions()` preservam tipos literais para payloads fortemente tipados e atalhos `$toast.<variant>()`.

## Magic API

```js
$toast("Hello")
$toast({ title: "Saved", variant: "success", position: "top-center" })
$toast.success("Saved") // only when "success" is in `variants`
$toast.dismiss(id)
$toast.dismissAt("top-center")
$toast.dismissAll()
$toast.fromPayload({ title: "Done", variant: "success" })
await $toast.promise(() => save(), {
  loading: "Saving...",
  success: "Saved",
  error: "Could not save",
})
```

| Método | Descrição |
|--------|-------------|
| `$toast(title, options?)` | Enfileira um toast `default`. Retorna o id do toast. |
| `$toast(payload)` | Enfileira com um objeto payload completo. |
| `$toast.<variant>(title, options?)` | Um atalho por entrada em `variants`. |
| `$toast.dismiss(id)` | Dispensa um toast por id (retornado de `$toast()`). |
| `$toast.update(id, patch)` | Atualiza o mesmo toast in-place (variant, title, content, action, …). |
| `$toast.dismissAt(position)` | Dispensa todos os toasts em uma pilha de posição. |
| `$toast.dismissAll()` | Dispensa todos os toasts em todas as pilhas. |
| `$toast.pushUnique(key, payload?)` | Dispensa toasts ativos com a mesma `key`, depois enfileira. |
| `$toast.fromPayload(payload)` | Enfileira a partir de um payload simples (eventos, flash de sessão, etc.). |
| `$toast.promise(factoryOrPromise, messages?)` | `loading` → `success` / `error` no mesmo toast. |

### Opções de payload

| Campo | Tipo | Padrão |
|-------|------|---------|
| `content` | `TContent \| null` | `null` |
| `title` | `string \| null` | `null` |
| `description` | `string \| null` | `null` |
| `variant` | `default \| …your variants` | `default` |
| `position` | `bottom-right \| …your positions` | `bottom-right` (ou `defaultPosition`) |
| `duration` | `number` (ms) | `4000` (`false` ou `0` = sem auto-dismiss; armazenado como `false`) |
| `action` | `{ label, onClick? }` | `null` |
| `key` | `string \| null` | `null` — use com `pushUnique` para toasts de slot único |

`title` / `description` são atalhos de string opcionais. Use `content` para qualquer forma que seu renderer entenda (objetos, arrays, trechos HTML, etc.). O plugin armazena como está — a renderização fica a cargo da sua UI.

```ts
type AppToastContent = { user: { name: string; avatar: string } } | { html: string };

type Item = ToastItem<typeof variants, typeof positions, AppToastContent>;

$toast({
  content: { user: { name: "Ada", avatar: "/ada.png" } },
  variant: "success",
});
```

```html
<template x-for="toast in $store.toast.itemsAt(position)" :key="toast.id">
  <div x-show="toast.content?.user">
    <img :src="toast.content.user.avatar" alt="" />
    <span x-text="toast.content.user.name"></span>
  </div>
  <p x-show="toast.title" x-text="toast.title"></p>
</template>
```

Para `$toast.promise`, `loadingContent`, `successContent` e `errorContent` opcionais atualizam o mesmo item de toast.

## Variants personalizados

```ts
import toast, { toastOptions, toastVariants, type ToastMagic } from "@ailuracode/alpinejs-toast";

const variants = toastVariants(["queued", "published", "failed"] as const);

Alpine.plugin(toast({ variants }));

type AppToast = ToastMagic<typeof variants>;
// AppToast has .queued(), .published(), .failed()
```

Sem `variants`, apenas `$toast()`, `$toast.promise()`, `$toast.dismiss()` e `$toast.fromPayload()` estão disponíveis.

## Positions personalizadas

Cada position declarada recebe sua **própria pilha**. `maxToasts` e `maxVisible` se aplicam **por position**, não globalmente.

```ts
import toast, { toastPositions, type ToastPosition } from "@ailuracode/alpinejs-toast";

const positions = toastPositions(["top-center", "bottom-right"] as const);

Alpine.plugin(
  toast({
    positions,
    defaultPosition: "bottom-right",
  })
);

type AppPosition = ToastPosition<typeof positions>;
// "bottom-right" | "top-center"
```

O plugin armazena o id da position em cada toast. Renderize uma pilha por position na sua UI:

```html
<template x-for="position in $store.toast.stackPositions" :key="position">
  <div
    x-bind:data-position="position"
    x-bind:class="{
      'fixed top-4 left-1/2 -translate-x-1/2': position === 'top-center',
      'fixed bottom-4 right-4': position === 'bottom-right',
    }"
  >
    <template x-for="(toast, index) in $store.toast.itemsAt(position)" :key="toast.id">
      <div x-show="!toast.removed && $store.toast.isVisibleAt(position, index)">
        <p x-text="toast.title"></p>
      </div>
    </template>
  </div>
</template>
```

| Store API | Descrição |
|-----------|-------------|
| `stackPositions` | Todas as chaves de pilha (`defaultPosition` + `positions`) |
| `itemsAt(position)` | Toasts nessa pilha, mais recentes primeiro (inclui itens com estado `removed`) |
| `timedItemsAt(position)` | Pilha temporizada com auto-dismiss — mesma ordem, inclui itens com estado `removed` |
| `persistentItemsAt(position)` | Pilha persistente (`duration: false`) — inclui itens com estado `removed` |
| `activeTimedItemsAt(position)` | Pilha temporizada sem itens `removed` — preferida para `x-for` simples |
| `activePersistentItemsAt(position)` | Pilha persistente sem itens `removed` |
| `isVisibleAt(position, index)` | Apenas pilha temporizada — peek/limita visibilidade (`maxVisible`) |
| `pushUnique(key, payload?)` | Igual a `$toast.pushUnique` |
| `destroy()` | Limpa timers — chame ao desmontar o plugin |
| `dismiss(id)` | Dispensa um toast (igual a `$toast.dismiss`) |
| `dismissAt(position)` | Dispensa uma posição inteira (temporizada + persistente) |
| `dismissAll()` | Dispensa todas as pilhas |

## Fluxo promise

Configure variants promise padrão nas opções do plugin, ou sobrescreva por chamada:

```js
Alpine.plugin(
  toast({
    variants: toastVariants(["loading", "success", "error"] as const),
    promise: {
      loading: "Loading...",
      error: "Something went wrong",
      loadingVariant: "loading",
      successVariant: "success",
      errorVariant: "error",
      duration: 4000,
    },
  })
);
```

```js
await $toast.promise(() => save(), {
  loading: "Saving...",
  success: (data) => `Saved ${data.id}`,
  error: "Could not save",
});
```

Se um variant nomeado estiver ausente em `variants`, os estados promise fazem fallback para `default`.

Em falha, o toast atualiza para o estado de erro e a promise retornada **rejeita** com o erro original para que chamadores ainda possam usar `try/catch` ou `.catch()`.

O estado **loading** usa uma duração temporizada longa (`PROMISE_LOADING_DURATION`) para permanecer na **pilha temporizada** (não perpétua). O timer é substituído quando a promise resolve para success ou error.

Nomes de variant reservados (`dismiss`, `update`, `dismissAt`, `dismissAll`, `fromPayload`, `promise`) não podem sobrescrever métodos core de `$toast`.

Em templates Alpine, envolva chamadas com múltiplos argumentos em uma arrow function:

```html
<button
  @click="() => $toast.promise(() => save(), { loading: 'Saving...', success: 'Saved!' })"
>
  Save
</button>
```

## Limites da fila

Cada **position** tem duas pilhas independentes:

1. **Temporizada** — toasts com auto-dismiss (`duration > 0`). `maxVisible` se aplica aqui (UI peek/stack).
2. **Persistente** — `duration: false` (ou `0` em payloads; normalizado para `false`). Sempre totalmente visível na sua UI.

`maxToasts` se aplica **por pilha por position** (não globalmente). Exemplo: `maxToasts: 5` permite até 5 toasts temporizados + 5 persistentes em `bottom-right`.

| Opção | Padrão | Descrição |
|--------|---------|-------------|
| `maxToasts` | `5` | Máximo de toasts ativos **por pilha por position**. `0` = ilimitado. |
| `maxVisible` | `maxToasts` | Máximo de toasts temporizados exibidos de uma vez por position (`isVisibleAt`). |

Use `activeTimedItemsAt` / `activePersistentItemsAt` quando seu renderer não precisa de itens com estado `removed`. Mantenha `timedItemsAt` / `persistentItemsAt` quando animar dismiss (estilo Sonner).

## Eventos window

```js
window.dispatchEvent(
  new CustomEvent("toast", {
    detail: { title: "From anywhere", variant: "success", position: "top-center" },
  })
);
```

Desabilite com `toast({ listenToWindowEvents: false })`.

## Renderizando UI

```html
<template x-for="position in $store.toast.stackPositions" :key="position">
  <div
    role="region"
    x-bind:aria-label="'Toasts ' + position"
    x-bind:data-position="position"
  >
    <template x-for="(toast, index) in $store.toast.itemsAt(position)" :key="toast.id">
      <div
        role="status"
        x-show="!toast.removed && $store.toast.isVisibleAt(position, index)"
        x-bind:data-variant="toast.variant"
      >
        <p x-text="toast.title"></p>
      </div>
    </template>
  </div>
</template>
```

Estilize `[data-variant="…"]` e `[data-position="…"]` no seu próprio CSS ou biblioteca de componentes.

## Opções do plugin

```js
Alpine.plugin(
  toast({
    variants: toastVariants(["success", "error"] as const),
    positions: toastPositions(["top-center", "bottom-right"] as const),
    defaultPosition: "bottom-right",
    defaultDuration: 5000,
    maxToasts: 5,
    maxVisible: 3,
    listenToWindowEvents: true,
    storeKey: "toast",
    promise: {
      loadingVariant: "success",
      successVariant: "success",
      errorVariant: "error",
    },
  })
);
```

## Pacotes relacionados

- [`@ailuracode/alpinejs-notify`](./notify.md) — Web Notifications em nível de SO (`$notify`)
