---
title: "Alpine.js Toolkit · @ailuracode"
description: "Toolkit modular para Alpine.js — init lazy, plugins headless e DX TypeScript moderna."
template: splash
hero:
  title: "Toolkit modular para Alpine.js"
  tagline: "Plugins headless com carregamento lazy para tema, layout, toasts e mais — instale só o que precisa, conecte seu próprio markup e CSS."
  actions:
    - text: "Primeiros passos"
      link: "/getting-started/"
      icon: "right-arrow"
      variant: "primary"
    - text: "Abrir playground"
      link: "/playground/"
      icon: "external"
      variant: "minimal"
---

Toolkit modular para **Alpine.js** por ailuracode — agnóstico ao framework, publicado no npm, pronto para TypeScript.

## O que é isto?

**@ailuracode/alpinejs-toolkit** não é uma coleção aleatória de plugins — é um **toolkit Alpine modular** baseado em três ideias:

| Pilar | O que você obtém |
|-------|------------------|
| **Init lazy** | [`@ailuracode/alpine-core`](./core.md) registra plugins sem executá-los na importação; carrega sob demanda com `import()` dinâmico. |
| **Headless** | Apenas stores e magics — sem CSS, sem componentes UI, sem suposições de Tailwind. Você aplica estilos via callbacks. |
| **DX moderna** | Globals TypeScript (`$store.theme`, `$toast`), pacotes npm tree-shakeáveis, loaders seguros para SSR. |

Comece com **Essenciais** — os módulos que a maioria dos apps precisa primeiro. Adicione pacotes **Estendidos** e **Avançados** somente quando necessário.

## Essenciais

| Pacote | API | Use quando |
|--------|-----|------------|
| [Theme](./plugins/theme.md) | `$store.theme` | Preferência claro / escuro / sistema |
| [Screen](./plugins/screen.md) | `$store.device` | Breakpoints responsivos em templates |
| [Scroll](./plugins/scroll.md) | `$store.scroll` | Progresso de scroll, body lock para overlays |
| [Sidebar](./plugins/sidebar.md) | `$store.sidebar` | Estado de drawer / nav shell |
| [Toast](./plugins/toast.md) | `$toast` | Mensagens in-app; [`fromPayload`](./plugins/toast.md) para objetos simples |

## Estendidos e avançados

- **Estendidos** — [network](./plugins/network.md), [visibility](./plugins/visibility.md), [clipboard](./plugins/clipboard.md), [platform](./plugins/platform.md), [touch](./plugins/touch.md), [toggle](./plugins/toggle.md)
- **Avançados** — [geo](./plugins/geo.md), [battery](./plugins/battery.md), [export](./plugins/export.md), [share](./plugins/share.md), [attention](./plugins/attention.md), [notify](./plugins/notify.md), [calendar](./plugins/calendar.md), [JSON:API](./plugins/json-api.md)
- **Query** — [cache agnóstico ao store](./query.md) com adaptadores opcionais e [devtools](./query-devtools.md)

## Explorar

- [Primeiros passos](./getting-started.md) — instalar, init lazy, uso em HTML
- [Core](./core.md) — registro, init diferido, imports dinâmicos
- [Playground](/playground/) — demos ao vivo (Essenciais em destaque)
