---
title: "Command"
description: "Paleta de comandos headless estilo Spotlight com busca, páginas aninhadas e ARIA."
---

Package: `@ailuracode/alpine-command`

Store headless de paleta de comandos (estilo Spotlight) — ações pesquisáveis, grupos, navegação por teclado, páginas aninhadas, execução assíncrona, aliases e helpers ARIA.

## Instalação

```bash
pnpm add @ailuracode/alpine-command alpinejs
```

A navegação do item ativo usa helpers inline — sem dependência extra.

## Configuração

```js
import Alpine from "alpinejs";
import { commandPlugin } from "@ailuracode/alpine-command";

Alpine.plugin(
  commandPlugin({
    searchStrategy: "substring",
    onRun(item) {
      console.log("Ran", item.id);
    },
    persistence: {
      maxRecent: 8,
      getRecent: () => JSON.parse(localStorage.getItem("recent-commands") ?? "[]"),
      setRecent: (ids) => localStorage.setItem("recent-commands", JSON.stringify(ids)),
    },
  })
);
Alpine.start();
```

## Store API

| Membro | Descrição |
|--------|-----------|
| `open()` / `close()` / `toggle()` | Visibilidade da paleta |
| `isOpen` | Se a paleta está aberta |
| `search` | String de filtro reativa |
| `activeIndex` | Linha destacada pelo teclado |
| `filteredItems` / `visibleItems` | Comandos visíveis na página atual |
| `groupedItems` | Itens filtrados agrupados por `group` |
| `register(item)` | Registra uma ação; retorna `unregister()` |
| `run(id)` / `cancelRun()` | Executa ou cancela trabalho assíncrono em andamento |
| `pushPage(page)` / `goBack()` | Páginas de comando aninhadas |
| `executionState` / `runningId` | Estado de execução assíncrona |
| `inputProps()` / `listboxProps()` / `optionProps(id)` | Props ARIA headless |
| `handleKeydown(event)` | Digitação, Backspace, Arrow/Home/End/Enter/Escape |

### Item de comando

```ts
{
  id: "toggle-theme",
  label: "Toggle theme",
  group?: "Appearance",
  shortcut?: "⌘K",
  keywords?: ["dark", "light"],
  aliases?: ["spotlight"],
  disabled?: false | (() => boolean),
  hidden?: false | (() => boolean),
  enabled?: true | (() => boolean),
  pinned?: false,
  page?: "root",
  load?: async () => {},
  action: () => {},
}
```

### Busca

- Estratégia padrão: ranking por substring em label, aliases, keywords, group e shortcut
- `searchStrategy: "fuzzy"` habilita correspondência fuzzy leve
- `rank(item, search)` substitui a API booleana deprecada `filter(item, search)`

Comandos desabilitados permanecem visíveis a menos que `hidden` seja `true`. Navegação por teclado e `run()` ignoram comandos desabilitados ou em carregamento.

## Integração

- **Overlay** — `overlayId` opcional documenta um id de camada para `$store.overlay.zIndexOf(overlayId, layer)`
- **Scroll** — passe `scroll: $store.scroll` para bloquear scroll da página enquanto aberto (habilitado por padrão quando fornecido)
- **Keyboard** — atalhos globais de abertura permanecem responsabilidade do consumidor; componha com `@ailuracode/alpine-keyboard` quando necessário
- **Dialog / Toast** — renderize a paleta em um painel de dialog ou chame `$toast()` de `action` / `onRun`

Nem overlay, scroll, keyboard, dialog nem toast são obrigatórios.

## SSR

Registre comandos no cliente. O controller não acessa globais do browser durante import ou construção.

## Uso standalone

```ts
import { createCommandController } from "@ailuracode/alpine-command";

const command = createCommandController();
command.register({ id: "save", label: "Save", action: () => {} });
command.open();
```

## Notas de migração

- `register()` agora retorna callback de unregister; `unregister(id)` permanece disponível
- `filter` está deprecado em favor de `rank` ou `searchStrategy`
- `filteredItems` agora inclui comandos desabilitados; use `itemState(id)?.disabled` ou `visibleItems` para estado em runtime
