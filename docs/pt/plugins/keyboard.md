---
title: "Keyboard"
description: "Registro headless de atalhos de teclado com escopos, acordes e sequências via $store.keyboard e $keyboard."
---

Package: `@ailuracode/alpine-keyboard`

Registro headless de atalhos de teclado com escopos, acordes, sequências, resolução de conflitos e normalização de `mod` por plataforma.

## Instalação

```bash
pnpm add @ailuracode/alpine-keyboard @ailuracode/alpine-core alpinejs
```

## Exemplo rápido

```ts
import Alpine from "alpinejs";
import { keyboardPlugin } from "@ailuracode/alpine-keyboard";

Alpine.plugin(
  keyboardPlugin({
    pauseWhileScopesActive: ["modal"],
    shortcuts: [
      {
        shortcut: "mod+k",
        handler: () => openCommandPalette(),
        options: {
          id: "command-palette",
          metadata: { label: "Open command palette", group: "Navigation" },
        },
      },
      {
        shortcut: "g h",
        handler: () => navigate("/"),
        options: { id: "go-home", metadata: { label: "Go home" } },
      },
    ],
  })
);

Alpine.start();
```

```html
<div
  x-data
  x-init="
    $keyboard.activateScope('editor');
    $keyboard.register('mod+s', () => save(), { scope: 'editor', id: 'save' });
  "
>
  <p x-text="$keyboard.commands.map((c) => c.label).join(', ')"></p>
</div>
```

## Store / magic API

`keyboardPlugin()` registra `$store.keyboard` e `$keyboard` (mesmo objeto reativo).

| Membro | Descrição |
|--------|-----------|
| `commands` | Metadados somente leitura dos atalhos para UIs de descoberta |
| `activeScopes` | Nomes dos escopos atualmente ativos |
| `suspendedScopes` | Escopos temporariamente desabilitados |
| `register(shortcut, handler, options?)` | Registra um atalho; retorna disposer |
| `unregister(id)` | Remove um atalho por id |
| `activateScope(scope)` | Habilita atalhos vinculados a um escopo |
| `deactivateScope(scope)` | Desabilita um escopo |
| `suspendScope(scope)` | Pausa um escopo sem desativá-lo |
| `resumeScope(scope)` | Retoma um escopo suspenso |
| `handleKeydown(event)` | Despacha um evento de teclado manualmente |

## Controller API

```ts
import { createKeyboard } from "@ailuracode/alpine-keyboard";

const keyboard = createKeyboard({
  sequenceTimeout: 1000,
  pauseWhileScopesActive: ["modal"],
});

const dispose = keyboard.register("escape", (event) => {
  closeDialog();
}, { scope: "modal", priority: 10 });

keyboard.activateScope("modal");
dispose();
keyboard.destroy();
```

## Sintaxe de atalhos

| Padrão | Significado |
|--------|-------------|
| `mod+k` | `meta+k` no macOS, `ctrl+k` em outros sistemas |
| `ctrl+shift+p` | Acorde com modificadores explícitos |
| `g h` | Sequência de duas teclas (timeout padrão de 1 s) |
| `escape` | Teclas nomeadas e aliases (`esc`, `space`, setas) |

## Escopos

Escopos controlam quais atalhos são elegíveis. O escopo padrão é `global`.

```ts
$keyboard.activateScope("editor");
$keyboard.register("mod+s", save, { scope: "editor", id: "save" });
$keyboard.suspendScope("editor"); // pausa temporária
$keyboard.deactivateScope("editor");
```

Configure `pauseWhileScopesActive: ["modal"]` no controller para pausar atalhos **somente globais** enquanto escopos modais estão ativos.

## Sequências

Tokens separados por espaço definem sequências de múltiplas teclas:

```ts
keyboard.register("g h", () => goHome(), { id: "go-home" });
```

As sequências reiniciam após `sequenceTimeout` (padrão `1000` ms) ou quando uma tecla inesperada é pressionada.

## Conflitos

Registros com o mesmo acorde no mesmo escopo emitem um evento `conflict`. Em runtime, o handler com maior `priority` vence.

## Alvos editáveis

Por padrão, atalhos não disparam quando o foco está em `input`, `textarea`, `select` ou elementos `contenteditable`. Passe `allowInEditable: true` para bindings específicos de editores.

## Acessibilidade

- Exponha metadados de `commands` em um painel de ajuda construído pelo host — este pacote não renderiza UI.
- Prefira acordes em vez de bindings globais de tecla única.
- Use atalhos com escopo dentro de overlays e configure `pauseWhileScopesActive`.
- Escute eventos `conflict` ao definir atalhos.

## Controller standalone

```ts
import { createKeyboard } from "@ailuracode/alpine-keyboard";

const keyboard = createKeyboard();
const dispose = keyboard.register("mod+k", handler);
keyboard.mount(); // idempotente — anexa um listener em window
keyboard.destroy(); // remove listeners e limpa registros
dispose();
```

## Não é objetivo deste pacote

- Substituir `x-on:keydown` para comportamento local de elementos
- Renderizar ajuda de atalhos ou UI de command palette (veja `@ailuracode/alpine-command`)
